module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    'standard'
  ],
  rules: {
    'generator-star-spacing': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  globals: {
    '$': true,
    'grecaptcha': true,
    'gtag': true,
    'jQuery': true,
    'PS_CAPTCHA': true,
    'PS_ENV': true,
    'PS_READY': true,
    'Overscroll': true
  }
}
