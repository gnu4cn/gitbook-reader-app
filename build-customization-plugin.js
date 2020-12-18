var merge = require('webpack-merge');

exports.default = {
    config: function (cfg) {
        const strategy = merge.strategy({
            'devtool': 'replace',
        });

        return strategy(cfg, {
            devtool: 'inline-source-map'
        });
    }
}
