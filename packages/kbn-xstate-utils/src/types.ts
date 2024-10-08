/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ActorRef, ActorRefWithDeprecatedState, EmittedFrom, State, StateValue } from 'xstate';

export type OmitDeprecatedState<T extends ActorRefWithDeprecatedState<any, any, any, any>> = Omit<
  T,
  'state'
>;

export type MatchedState<
  TState extends State<any, any, any, any, any>,
  TStateValue extends StateValue
> = TState extends State<
  any,
  infer TEvent,
  infer TStateSchema,
  infer TTypestate,
  infer TResolvedTypesMeta
>
  ? State<
      (TTypestate extends any
        ? { value: TStateValue; context: any } extends TTypestate
          ? TTypestate
          : never
        : never)['context'],
      TEvent,
      TStateSchema,
      TTypestate,
      TResolvedTypesMeta
    > & {
      value: TStateValue;
    }
  : never;

export type MatchedStateFromActor<
  TActorRef extends ActorRef<any, any>,
  TStateValue extends StateValue
> = MatchedState<EmittedFrom<TActorRef>, TStateValue>;
