
export default {
    entry: 'src/main.js',
    plugins: function() {
        return [
            ['./plugins/cw-build-plugin.js', {}],
            
            function(api, options) {
                // console.log('anonymous plugin', options);
            }
        ]
    },
    hooks: [
        // [ 
        //     'start', 
        //     function(...args) {
        //         console.log('start', args);
        //     } 
        // ],
        ['plugin', (webpackConfig) => {
            // console.log('testHook', webpackConfig?.toConfig())
        }]
    ]
}