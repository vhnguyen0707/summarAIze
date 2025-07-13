const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack'); // Add this line to require webpack
const dotenv = require('dotenv').config(); // Load .env variables

module.exports = {
    entry: {
        // Specify entry points for different parts of the extension. Each is a separate bundle that Webpack will create
        // with all the imports & dep included in each entry point
        content: './src/scripts/content.ts',
        popup: './src/components/popup.tsx'
    },
    output: {
        // Defines naming format and output directory for the bundled files. We output to the public/ which is loaded by the extension
        filename: '[name].js',
        path: path.resolve(__dirname, 'public'),
    },
    module: {
        // Define how different file types should be handled
        // A loader preprocesses files before they are bundled by Webpack (transforming the src files into a format that Webpack can understand)
        rules: [
            {// transpile TypeScript files to JS
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            { // process CSS to JS-compatible modules
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'], // Load CSS
            },
        ],
    },

    resolve: { // resolve allows us to import files without specifying their extensions
        extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: [ // additional tools
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'popup.html',
            chunks: ['popup']
        }),
        // replace process.env variables with their values from .env file
        // dotenv in ts files are not accessible at compile time but run time so we use DefinePlugin to make them accessible
        // during compilation
        new webpack.DefinePlugin({
            'process.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
            'process.env.HF_TOKEN': JSON.stringify(process.env.HF_TOKEN),
        }),
    ],
};
