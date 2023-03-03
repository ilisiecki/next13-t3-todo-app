{
}

/** @type {import("prettier").Config} */
const config = {
  printWidth: 105,
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

module.exports = config;
