import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    acceptsQuery?: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
  }
}

export {};
