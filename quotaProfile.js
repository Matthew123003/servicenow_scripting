function onChange(control, oldValue, newValue, isLoading) {

    if (isLoading) {
        return;
    }

    var quotaMap = {
        'xs':    { cpu: '0.5',  memory: '1gi',    pods: '5' },
        's':     { cpu: '1',    memory: '2gi',    pods: '10' },
        'm':     { cpu: '2',    memory: '4gi',    pods: '20' },
        'l':     { cpu: '4',    memory: '8gi',    pods: '40' },
        'xl':    { cpu: '8',    memory: '16gi',   pods: '80' },
        'xxl':   { cpu: '16',   memory: '24gi',   pods: '160' },
        'xxxl':  { cpu: '24',   memory: '32gi',   pods: '240' },
        '4xl':   { cpu: '32',   memory: '48gi',   pods: '320' },
        '5xl':   { cpu: '48',   memory: '64gi',   pods: '480' },
        '6xl':   { cpu: '64',   memory: '96gi',   pods: '640' },
        '7xl':   { cpu: '96',   memory: '128gi',  pods: '960' },
        '8xl':   { cpu: '128',  memory: '192gi',  pods: '1280' },
        '9xl':   { cpu: '192',  memory: '256gi',  pods: '1920' },
        '10xl':  { cpu: '256',  memory: '384gi',  pods: '2560' },
        '11xl':  { cpu: '384',  memory: '512gi',  pods: '3840' },
        '12xl':  { cpu: '512',  memory: '768gi',  pods: '5120' },
        '13xl':  { cpu: '768',  memory: '1024gi', pods: '7680' },
        '14xl':  { cpu: '1024', memory: '1536gi', pods: '10240' },
        '15xl':  { cpu: '1536', memory: '2048gi', pods: '15360' }
    };

    // Always make the fields editable first so they can be cleared/changed.
    g_form.setReadOnly('cpu_quota', false);
    g_form.setReadOnly('memory_quota', false);
    g_form.setReadOnly('pods_limit', false);

    // Always clear old values first to prevent stale data.
    g_form.setValue('cpu_quota', '');
    g_form.setValue('memory_quota', '');
    g_form.setValue('pods_limit', '');

    // --None--
    // Leave fields cleared and editable.
    if (newValue == '') {
        return;
    }

    // Custom
    // Leave fields cleared and editable so requester can select values.
    if (newValue == 'custom') {

        g_form.addInfoMessage(
            'Please manually select CPU Quota, Memory Quota, and Pods Limit.'
        );

        return;
    }

    // Predefined quota profile
    var selected = quotaMap[newValue];

    if (selected) {

        g_form.setValue('cpu_quota', selected.cpu);
        g_form.setValue('memory_quota', selected.memory);
        g_form.setValue('pods_limit', selected.pods);

        // Predefined values cannot be manually changed.
        g_form.setReadOnly('cpu_quota', true);
        g_form.setReadOnly('memory_quota', true);
        g_form.setReadOnly('pods_limit', true);
    }
}