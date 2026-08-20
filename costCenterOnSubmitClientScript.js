function onSubmit() {
   
    var costCenter = g_form.getValue('cost_center_org');
    var costCenterNumber = g_form.getDisplayValue('cost_center_org');
    // alert(costCenterNumber);


	var supportGroup = g_form.getValue('support_group');
	var supportDl = g_form.getValue('support_dl');
    var itSupportManager = g_form.getValue('it_support_manager');
    var preferDest = g_form.getValue('preferred_destination');
    var costCenterManager = g_form.getValue('cost_center_owner');
    var appOwner = g_form.getValue('it_app_owner');
    var flag = false;

    var appOwnerflag = g_form.getValue("app_owner_is_active");
    var ccManagerflag = g_form.getValue("cost_center_manager_is_active");


    if (costCenter == '' || itSupportManager == '' || costCenterManager == '' || costCenterManager == '86639313dba82810efd51fe968961995' || appOwnerflag == 'false' || ccManagerflag == 'false' || costCenterNumber.startsWith('9') || supportGroup == '' || supportDl == '' || appOwner == '') {


        if (costCenter == '') {
            spModal.open({
                'title': 'Cost Center must be updated',
                'message': 'Selected cost center must be updated in AppLab for the chosen APM# prior to submitting a NextGen Cloud Intake. Please try again once all APM# updates have been completed. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">NextGen Cloud Intake – Cost Center Validation Error Handling</a> page.',
                'buttons': [{
                    label: 'OK',
                    primary: true
                }],
                'backdrop': 'static',

            }).then(function(ans) {
                if (ans.label == "OK") {
					//alert('party')
                }
            });

        } else if (itSupportManager == '') {
            spModal.open({
                'title': 'IT Support manager must be updated',
                'message': 'IT Support Manager (CI Owner) must be updated in AppLab before submitting a NextGen Cloud Intake.  Please correct within APM# and re-submit after all APM# fields are finalized.',
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
        } else if (costCenterManager == '' || costCenterManager == '86639313dba82810efd51fe968961995') {

            spModal.open({
                'title': 'Cost Center must be updated',
                'message': 'An invalid selected Cost Center is associated with your APM. Cost Center Manager is either blank or a Guest. Please update to a valid cost center in order to submit your NextGen Cloud Intake. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">NextGen Cloud Intake – Cost Center Validation Error Handling</a> page.',
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
        } else if (appOwnerflag == 'false') {
            spModal.open({
                'title': 'Application Owner must be updated',
                'message': 'Application owner associated with your APM is inactive.  Please update to a valid Application owner in order to submit your NextGen Cloud Intake.',
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
        } else if (ccManagerflag == 'false') {

            spModal.open({
                'title': 'Invalid Cost Center',
                'message': 'Cost Center update required as the current cost center cannot be used for cloud expenses.  The associated Cost Center manager is currently showing as an inactive associate.  Update to the Cost Center and/or Cost Center Manager must be resolved before a NextGen Cloud Intake can be submitted.  Please reach out to your ELV Finance associate for any CC Q/A and partner our NextGen Cloud Intake admins to assist if needed. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">NextGen Cloud Intake – Cost Center Validation Error Handling</a> page.',
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
        } else if (costCenterNumber.startsWith('9')) {
            spModal.open({
                'title': 'Invalid CC error notice.',
                'message': 'Invalid cost center has been associated with your selected Business Application - APM# for this NextGen Cloud Intake submission. Cost Center must be approved for cloud expenses. Please save your NextGen Cloud Intake submission as a template to save progress in NextGen Cloud Intake, update with a valid cost center within AppLab - APM#, and re-open NextGen Cloud Intake to submit your NextGen Cloud Intake. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">NextGen Cloud Intake – Cost Center Validation Error Handling</a> page.',
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
        } else if (supportGroup == '') {
            spModal.open({
                'title': 'Support Group must be updated',
                'message': 'Support Group must be updated in AppLab before submitting a NextGen Cloud Intake.  Please correct within APM# and re-submit after all APM# fields are finalized.',
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
        } else if (supportDl == '') {
            spModal.open({
                'title': 'Support DL must be updated',
                'message': 'Support DL must be updated in AppLab before submitting a NextGen Cloud Intake. Support DL needs to be in the correct format as well when updated ( dl-*****@******.com ) Please correct within APM# and re-submit after all APM# fields are finalized.',
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
        } else if (appOwner == '') {
            spModal.open({
                'title': 'IT Application Owner must be updated',
                'message': 'IT Application Owner must be updated in AppLab before submitting a NextGen Cloud Intake.  Please correct within APM# and re-submit after all APM# fields are finalized.',
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
        }

    } else {
        flag = true;
    }
    return flag;
}
