class ConfigSpreader {
    constructor(config, instances) {
        this.config = config;
        this.instances = instances;
    }

    addInstances(instances) {
        if (this.instances !== undefined) {
            this.instances = this.instances.concat(instances);
        } else {
            this.instances = instances;
        }
    }

    spread(config) {
        this.config = config;
        this.instances.forEach(instance => {
            try {
                instance.setConfig(config);
            } catch (e) {
                
                // some might not have a SetConfig() method
            }
        });
    }
}

export { ConfigSpreader };