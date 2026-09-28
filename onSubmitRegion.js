function onSubmit() {
  
    var destination = g_form.getValue('destination');             // aws / azr
    var environment = g_form.getValue('environment');             // slvr / gld / plat
    var region = g_form.getValue('region');                       // us-east-1, us-east-2, us-west-2, EastUS2, CentralUS

    var nonDefaultRegionRequest = g_form.getValue('non_default_region_request');   // checkbox, true/false

    var flag = false;

    // Default region by Destination + Environment.
    var DEFAULT_REGIONS = {
        'aws': {
            'slvr': 'us-east-2',
            'gld':  'us-east-1',
            'plat': 'us-east-1'
        },
        'azr': {
            'slvr': 'CentralUS',
            'gld':  'EastUS2',
            'plat': 'EastUS2'
        }
    };

    var destDefaults = DEFAULT_REGIONS[destination];
    var defaultRegion = destDefaults ? destDefaults[environment] : null;

    // No default mapped (e.g. a destination other than AWS/Azure) — nothing to check.
    var isDefaultRegion = !!defaultRegion && region == defaultRegion;

    if (isDefaultRegion && nonDefaultRegionRequest == 'true') {

        spModal.open({
            'title': 'Non-Default Region Checkbox Selected',
            'message': 'The Region you selected is already the default for the chosen Destination and Environment. Please uncheck the Non-Default Region checkbox before submitting.',
            'buttons': [{
                label: 'OK',
                primary: true
            }],
            'backdrop': 'static',

        }).then(function(ans) {
            if (ans.label == "OK") {
                //alert('party');
            }
        });

    } else {
        flag = true;
    }

    return flag;
   
}

