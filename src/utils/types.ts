type Fn = (...args: any[]) => any;

export type PromiseValue<T extends Fn> = ReturnType<T> extends Promise<infer R> ? R : never;

export type Result<
  T extends (...args: any[]) => any,
  P extends keyof PromiseValue<T> = any
> = P extends keyof PromiseValue<T> ? Pick<PromiseValue<T>, P> : PromiseValue<T>;

export type Element<T extends any[]> = T extends infer A ? A : never;
