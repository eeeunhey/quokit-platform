declare module 'translate-google' {
  function translate(text: string, options: { to: string; from?: string }): Promise<string>;
  export default translate;
}
