const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
//const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        filename: '[name].bundle.js',
        library: 'libary',
        libraryTarget: 'var',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg)$/,
                use: 'file-loader'
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true,
        inline: true,
        contentBase: './dist'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new CopyWebpackPlugin({
            patterns: ['index.html']
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
};