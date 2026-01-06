#!/usr/bin/env bash
set -euo pipefail

GIT_SCOPE="renovate.json"

KIBANA_MACHINE_USERNAME="kibanamachine"
KIBANA_MACHINE_EMAIL="42973632+kibanamachine@users.noreply.github.com"

report_main_step () {
  echo "--- $1"
}

node_print_reviewers () {
  local report_path="$1"

  node - "$report_path" <<'NODE'
const fs = require('fs');

const reportPath = process.argv[1];
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const drifts = Array.isArray(report.managedRuleDrift) ? report.managedRuleDrift : [];

const reviewers = new Set();
for (const d of drifts) {
  const after = Array.isArray(d.after) ? d.after : [];
  for (const r of after) {
    if (typeof r === 'string' && r.startsWith('team:')) {
      reviewers.add(`elastic/${r.slice('team:'.length)}`);
    }
  }
}

process.stdout.write(Array.from(reviewers).sort().join(' '));
NODE
}

node_print_mentions () {
  local report_path="$1"

  node - "$report_path" <<'NODE'
const fs = require('fs');

const reportPath = process.argv[1];
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const drifts = Array.isArray(report.managedRuleDrift) ? report.managedRuleDrift : [];

const mentions = new Set();
for (const d of drifts) {
  const after = Array.isArray(d.after) ? d.after : [];
  for (const r of after) {
    if (typeof r === 'string' && r.startsWith('team:')) {
      mentions.add(`@elastic/${r.slice('team:'.length)}`);
    }
  }
}

process.stdout.write(Array.from(mentions).sort().join(' '));
NODE
}

best_effort_request_reviewers () {
  local pr_number="$1"
  shift

  if [ "$#" -eq 0 ]; then
    return 0
  fi

  echo "--- Requesting reviewers (best-effort)"
  for reviewer in "$@"; do
    if gh pr edit "$pr_number" --add-reviewer "$reviewer" >/dev/null 2>&1; then
      echo "Requested review from $reviewer"
    else
      echo "WARN: Failed to request review from $reviewer (continuing)"
    fi
  done
}

main () {
  cd "$KIBANA_DIR"

  report_main_step "Bootstrapping Kibana"
  .buildkite/scripts/bootstrap.sh

  report_main_step "Checking renovate reviewer drift (managed rules only)"

  REPORT_JSON="$(mktemp)"
  set +e
  node scripts/sync_renovate_reviewers.js --check --report-json "$REPORT_JSON"
  CHECK_EXIT="$?"
  set -e

  if [ "$CHECK_EXIT" -eq 0 ]; then
    echo "No managed reviewer drift detected. Exiting."
    exit 0
  fi

  report_main_step "Managed drift detected. Applying updates"
  node scripts/sync_renovate_reviewers.js --write --report-json "$REPORT_JSON"

  set +e
  git diff --exit-code --quiet "$GIT_SCOPE"
  if [ $? -eq 0 ]; then
    echo "No changes in $GIT_SCOPE after applying updates. Exiting."
    exit 0
  fi
  set -e

  report_main_step "Differences found. Checking for an existing pull request."

  git config --global user.name "$KIBANA_MACHINE_USERNAME"
  git config --global user.email "$KIBANA_MACHINE_EMAIL"

  PR_TITLE='[Renovate] Sync reviewers for managed rules'
  PR_BODY=$'This PR syncs `renovate.json` `packageRules[*].reviewers` for rules explicitly opted in via:\n\n- `x_kbn_reviewer_sync.mode: \"sync\"`\n\nThis is generated automatically and is intended to be non-disruptive (report-only rules are not updated).\n'

  pr_search_result="$(gh pr list --search "$PR_TITLE" --state open --author "$KIBANA_MACHINE_USERNAME" --limit 1 --json title -q ".[].title")"
  if [ "$pr_search_result" == "$PR_TITLE" ]; then
    echo "PR already exists. Exiting."
    exit 0
  fi

  echo "No existing PR found. Committing changes."

  BRANCH_NAME="renovate_reviewer_sync_$(date +%s)"

  reviewers="$(node_print_reviewers "$REPORT_JSON" || true)"
  mentions="$(node_print_mentions "$REPORT_JSON" || true)"
  if [ -z "${reviewers:-}" ]; then
    reviewers="elastic/kibana-operations"
  fi
  if [ -n "${mentions:-}" ]; then
    PR_BODY+=$'\n\nReview requested from computed owners: '"$mentions"$'\n'
  fi

  git checkout -b "$BRANCH_NAME"
  git add "$GIT_SCOPE"
  git commit -m "Sync renovate reviewers"

  report_main_step "Changes committed. Creating pull request."

  git push origin "$BRANCH_NAME"

  # Create PR first WITHOUT reviewers so a single invalid/unrequestable team can't block creation.
  pr_url="$(gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main \
    --head "$BRANCH_NAME" \
    --label 'release_note:skip' \
    --label 'backport:skip' \
    --label 'Team:Kibana Operations')"

  pr_number="${pr_url##*/}"

  # Best-effort: request reviews from computed teams; never fail the job due to reviewer issues.
  # Always try ops team first so someone sees it even if computed team requests fail.
  best_effort_request_reviewers "$pr_number" elastic/kibana-operations
  # shellcheck disable=SC2086
  best_effort_request_reviewers "$pr_number" $reviewers
}

main
