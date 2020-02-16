export default (config, env, helpers) => {
  if (!env.production) {
    config.devServer.proxy = [
      {
        path: '/api/**',
        target: 'http://0.0.0.0:4200',
        // ...any other stuff...
      }
    ];
  }
}
