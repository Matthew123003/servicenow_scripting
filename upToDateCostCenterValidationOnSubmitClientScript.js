function onSubmit() {
   
    var costCenter = g_form.getValue('cost_center_org');
    var costCenterNumber = g_form.getDisplayValue('cost_center_org');
    // alert(costCenterNumber);

    var itSupportManager = g_form.getValue('it_support_manager');
    var preferDest = g_form.getValue('preferred_destination');
    var costCenterManager = g_form.getValue('cost_center_owner');
    var appOwner = g_form.getValue('ba_it_application_owner');
    var flag = false;

    var appOwnerflag = g_form.getValue("app_owner_is_active");
    var ccManagerflag = g_form.getValue("cost_center_manager_is_active");


    if (costCenter == '' || itSupportManager == '' || costCenterManager == '' || costCenterManager == '86639313dba82810efd51fe968961995' || appOwnerflag == 'false' || ccManagerflag == 'false' || costCenterNumber.startsWith('9')) {


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
                    //alert('party');

                }
            });

        } else if (itSupportManager == " ") {
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
                'message': 'An invalid selected Cost Center is associated with your APM.  Please update to a valid cost center in order to submit your NextGen Cloud Intake. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">NextGen Cloud Intake – Cost Center Validation Error Handling</a> page.',
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
        }

    } else {
        flag = true;
    }
    return flag;
}


// function onSubmit() {
   
//     var costCenter = g_form.getValue('cst_center');
//     var costCenterNumber = g_form.getDisplayValue('cst_center');
//     // alert(costCenterNumber);

//     var itSupportManager = g_form.getValue('it_support_manager');
//     var preferDest = g_form.getValue('preferred_destination');
//     var costCenterManager = g_form.getValue('cost_center_manager');
//     var appOwner = g_form.getValue('ba_it_application_owner');
//     var flag = false;

//     var appOwnerflag = g_form.getValue("application_owner_is_active");
//     var ccManagerflag = g_form.getValue("cost_center_manager_is_active");


//     if (costCenter == '' || itSupportManager == '' || costCenterManager == '' || costCenterManager == '86639313dba82810efd51fe968961995' || appOwnerflag == 'false' || ccManagerflag == 'false' || costCenterNumber.startsWith('9')) {


//         if (costCenter == '') {
//             spModal.open({
//                 'title': 'Cost Center must be updated',
//                 'message': 'Selected cost center must be updated in AppLab for the chosen APM# prior to submitting a Cloud Intake Request (CIR). Please try again once all APM# updates have been completed. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });

//         } else if (itSupportManager == " ") {
//             spModal.open({
//                 'title': 'IT Support manager must be updated',
//                 'message': 'IT Support Manager (CI Owner) must be updated in AppLab before submitting a Cloud Intake Request (CIR).  Please correct within APM# and re-submit after all APM# fields are finalized.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });
//         } else if (costCenterManager == '' || costCenterManager == '86639313dba82810efd51fe968961995') {

//             spModal.open({
//                 'title': 'Cost Center must be updated',
//                 'message': 'An invalid selected Cost Center is associated with your APM.  Please update to a valid cost center in order to submit your cloud intake request.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });
//         } else if (appOwnerflag == 'false') {
//             spModal.open({
//                 'title': 'Application Owner must be updated',
//                 'message': 'Application owner associated with your APM is inactive.  Please update to a valid Application owner in order to submit your cloud intake request.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });
//         } else if (ccManagerflag == 'false') {

//             spModal.open({
//                 'title': 'Invalid Cost Center',
//                 'message': 'Cost Center update required as the current cost center cannot be used for cloud expenses.  The associated Cost Center manager is currently showing as an inactive associate.  Update to the Cost Center and/or Cost Center Manager must be resolved before a CIR can be submitted.  Please reach out to your ELV Finance associate for any CC Q/A and partner our Cloud Intake admins to assist if needed.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });
//         } else if (costCenterNumber.startsWith('9')) {
//             spModal.open({
//                 'title': 'Invalid CC error notice.',
//                 'message': 'Invalid cost center has been associated with your selected Business Application - APM# for this CIR submission. Cost Center must be approved for cloud expenses. Please save your CIR submission as a template to save progress in Central Intake, update with a valid cost center within AppLab - APM#, and re-open Central Intake to submit your Cloud Intake Request.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',
//                 'buttons': [{
//                     label: 'OK',
//                     primary: true
//                 }],
//                 'backdrop': 'static',

//             }).then(function(ans) {
//                 if (ans.label == "OK") {
//                     //alert('party');

//                 }
//             });
//         }

//     } else {
//         flag = true;
//     }
//     return flag;
// }