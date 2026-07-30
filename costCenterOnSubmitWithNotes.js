/**
 * CATALOG CLIENT SCRIPT: onSubmit
 *
 * This function runs when the user attempts to submit the catalog item.
 *
 * ServiceNow expects an onSubmit Catalog Client Script to return either:
 *
 *     true
 *
 * or:
 *
 *     false
 *
 * Returning true allows the catalog item to submit.
 * Returning false stops the submission and keeps the user on the form.
 *
 * This script begins with submission blocked by default:
 *
 *     var flag = false;
 *
 * It then checks several Cost Center, Application Owner, and manager-related
 * variables.
 *
 * If any invalid condition is found:
 *
 * 1. A modal message is displayed.
 * 2. flag remains false.
 * 3. The catalog item is not submitted.
 *
 * If every validation passes:
 *
 * 1. flag is changed to true.
 * 2. The catalog item is allowed to submit.
 */
function onSubmit() {

    /*
     * SECTION 1: RETRIEVE THE SELECTED COST CENTER
     *
     * g_form represents the catalog form currently displayed to the user.
     *
     * getValue('cst_center') retrieves the stored value of the cst_center
     * variable.
     *
     * Because cst_center appears to be a reference variable, the stored value
     * is normally the sys_id of the selected Cost Center record.
     *
     * Example:
     *
     * The user sees:
     *
     *     912345
     *
     * But getValue() may return:
     *
     *     4c582a11db123010abcdef1234567890
     *
     * This variable is mainly used to determine whether a Cost Center record
     * has been selected.
     */
    var costCenter = g_form.getValue('cst_center');


    /*
     * SECTION 2: RETRIEVE THE VISIBLE COST CENTER NUMBER
     *
     * getDisplayValue('cst_center') retrieves the value displayed to the user
     * instead of the referenced record's sys_id.
     *
     * In this case, the displayed value is expected to be the Cost Center
     * number, such as:
     *
     *     912345
     *
     * This value is needed because the script later checks whether the Cost
     * Center number starts with 9.
     *
     * The sys_id cannot be used for that check because the sys_id does not
     * represent the visible Cost Center number.
     */
    var costCenterNumber = g_form.getDisplayValue('cst_center');


    /*
     * DEBUGGING LINE
     *
     * This alert is commented out and does not currently run.
     *
     * During testing, removing the two forward slashes would display the
     * Cost Center's visible value.
     *
     * Example:
     *
     *     alert(costCenterNumber);
     *
     * might display:
     *
     *     912345
     *
     * This can help confirm that getDisplayValue() is returning the value
     * expected by the startsWith('9') validation.
     */
    // alert(costCenterNumber);


    /*
     * SECTION 3: RETRIEVE THE IT SUPPORT MANAGER
     *
     * This gets the current value of the it_support_manager variable.
     *
     * If this is a reference variable, the value is likely the selected
     * user's sys_id.
     *
     * If no IT Support Manager has been selected, ServiceNow normally returns
     * an empty string:
     *
     *     ''
     *
     * Later, the script checks whether this variable is empty.
     */
    var itSupportManager = g_form.getValue('it_support_manager');


    /*
     * SECTION 4: RETRIEVE THE PREFERRED DESTINATION
     *
     * This gets the selected value from the preferred_destination variable.
     *
     * Example values might be:
     *
     *     aws
     *     az
     *
     * However, preferDest is not referenced anywhere else in this script.
     *
     * Therefore, the Preferred Destination currently has no effect on whether
     * submission is allowed or blocked.
     *
     * This line may have been added for future validation or may be leftover
     * from older logic.
     */
    var preferDest = g_form.getValue('preferred_destination');


    /*
     * SECTION 5: RETRIEVE THE COST CENTER MANAGER
     *
     * This retrieves the stored value of the cost_center_manager variable.
     *
     * If this is a reference variable, this value is expected to be the
     * selected manager's sys_id.
     *
     * The script later checks whether:
     *
     * 1. The Cost Center Manager is empty.
     * 2. The Cost Center Manager matches one of several prohibited sys_ids.
     */
    var costCenterManager = g_form.getValue('cost_center_manager');


    /*
     * SECTION 6: RETRIEVE THE APPLICATION OWNER
     *
     * This retrieves the stored value of the ba_it_application_owner variable.
     *
     * If this is a reference variable, this is likely the Application Owner's
     * sys_id.
     *
     * However, appOwner is not used anywhere else in this script.
     *
     * The script does not check whether appOwner itself is empty. Instead, it
     * checks the separate application_owner_is_active variable.
     *
     * Therefore, this line currently does not affect the validation result.
     */
    var appOwner = g_form.getValue('ba_it_application_owner');


    /*
     * SECTION 7: CREATE THE SUBMISSION CONTROL FLAG
     *
     * The flag variable controls the final return value of the script.
     *
     * It starts as false, which means:
     *
     *     Block submission.
     *
     * The script only changes flag to true when none of the invalid conditions
     * are found.
     *
     * This is a "deny by default" design:
     *
     *     Start by blocking submission.
     *     Only allow submission after every validation passes.
     */
    var flag = false;


    /*
     * SECTION 8: RETRIEVE THE APPLICATION OWNER ACTIVE FLAG
     *
     * This gets the value of application_owner_is_active.
     *
     * It is likely a hidden variable populated by another Catalog Client
     * Script, GlideAjax call, reference lookup, or form calculation.
     *
     * Catalog variable values are generally returned as strings.
     *
     * Therefore, the script compares this value to:
     *
     *     'false'
     *
     * rather than the Boolean value:
     *
     *     false
     *
     * Expected values:
     *
     *     'true'
     *     'false'
     */
    var appOwnerflag = g_form.getValue('application_owner_is_active');


    /*
     * SECTION 9: RETRIEVE THE COST CENTER MANAGER ACTIVE FLAG
     *
     * This gets the value of cost_center_manager_is_active.
     *
     * Like appOwnerflag, this is likely populated elsewhere and indicates
     * whether the selected Cost Center Manager is active.
     *
     * Expected values:
     *
     *     'true'
     *     'false'
     */
    var ccManagerflag = g_form.getValue('cost_center_manager_is_active');


    /*
     * SECTION 10: MASTER INVALID-CONDITION CHECK
     *
     * This large if statement asks:
     *
     *     "Is anything invalid?"
     *
     * The || operator means OR.
     *
     * Therefore, only one of these conditions needs to be true for the script
     * to enter the validation-error section.
     *
     * The conditions are checked from left to right.
     */
    if (
        /*
         * CONDITION 1:
         *
         * No Cost Center has been selected.
         */
        costCenter == '' ||

        /*
         * CONDITION 2:
         *
         * No IT Support Manager has been selected.
         */
        itSupportManager == '' ||

        /*
         * CONDITION 3:
         *
         * No Cost Center Manager is available.
         */
        costCenterManager == '' ||

        /*
         * CONDITION 4:
         *
         * The Cost Center Manager matches this specifically prohibited user
         * sys_id.
         *
         * The script treats this manager as invalid even if the person is
         * technically active.
         */
        costCenterManager == '86639313dba82810efd51fe968961995' ||

        /*
         * CONDITION 5:
         *
         * The Application Owner is marked as inactive.
         */
        appOwnerflag == 'false' ||

        /*
         * CONDITION 6:
         *
         * The Cost Center Manager is marked as inactive.
         */
        ccManagerflag == 'false' ||

        /*
         * CONDITION 7:
         *
         * The visible Cost Center number begins with 9.
         *
         * startsWith('9') checks only the beginning of the string.
         *
         * Examples:
         *
         *     912345  -> true, invalid
         *     900001  -> true, invalid
         *     812345  -> false
         *     123459  -> false
         *
         * The last example contains a 9, but it is allowed by this particular
         * rule because the 9 is not the first character.
         */
        costCenterNumber.startsWith('9') ||

        /*
         * CONDITIONS 8 AND 9:
         *
         * The Cost Center Manager matches either of two additional prohibited
         * user sys_ids.
         */
        costCenterManager == 'a26fd0b3933f79504e67fcb86cba10df' ||
        costCenterManager == 'fc59fa130fb9310039190bcce1050e59'
    ) {


        /*
         * SECTION 11: DETERMINE WHICH ERROR MESSAGE TO DISPLAY
         *
         * The master condition above only determines that something is wrong.
         *
         * This inner if / else-if chain determines which specific error message
         * should be displayed.
         *
         * Only the first matching branch runs.
         *
         * Once one condition matches, the later else-if conditions are not
         * evaluated.
         */


        /*
         * ERROR 1: COST CENTER IS EMPTY
         *
         * This is checked first, so it has the highest display priority.
         *
         * If both the Cost Center and Application Owner are invalid, the user
         * sees the Cost Center message first because this branch appears first.
         */
        if (costCenter == '') {

            /*
             * spModal.open() opens a modal dialog in Service Portal or
             * Employee Center.
             *
             * The object passed into open() defines:
             *
             * - The modal title
             * - The message
             * - The available buttons
             * - Whether clicking outside the modal closes it
             */
            spModal.open({

                /*
                 * The title displayed at the top of the modal.
                 */
                'title': 'Cost Center must be updated',

                /*
                 * The detailed message displayed to the user.
                 *
                 * The message contains an HTML hyperlink.
                 *
                 * target="_blank" instructs the browser to open the linked
                 * Confluence page in a new tab or window.
                 */
                'message': 'Selected cost center must be updated in AppLab for the chosen APM# prior to submitting a Cloud Intake Request (CIR). Please try again once all APM# updates have been completed. For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',

                /*
                 * The buttons array defines the buttons shown in the modal.
                 *
                 * This modal contains one button:
                 *
                 *     OK
                 *
                 * primary: true displays it as the primary action.
                 */
                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                /*
                 * A static backdrop means the user cannot dismiss the modal by
                 * clicking outside it.
                 *
                 * The user must interact with the available modal button.
                 */
                'backdrop': 'static'

            /*
             * spModal.open() returns a Promise-like result.
             *
             * The .then() section describes what should happen after the user
             * interacts with the modal.
             */
            }).then(function(ans) {

                /*
                 * function(ans) is a callback function.
                 *
                 * A callback is code that runs after another operation finishes.
                 *
                 * In this case:
                 *
                 * 1. The modal opens.
                 * 2. The user clicks a button.
                 * 3. The callback function runs.
                 * 4. ans contains information about the selected button.
                 *
                 * The name ans likely means "answer," but it could be renamed
                 * result, response, modalResult, or another descriptive name.
                 */

                /*
                 * ans.label contains the label of the button clicked by the user.
                 *
                 * Because the only button is labeled OK, ans.label should be
                 * equal to 'OK' when the user clicks it.
                 */
                if (ans.label == 'OK') {

                    /*
                     * There is currently no active code inside this block.
                     *
                     * The alert is commented out, so clicking OK only closes
                     * the modal.
                     *
                     * It does not resubmit the form, clear a field, or perform
                     * another action.
                     */
                    // alert('party');
                }
            });


        /*
         * ERROR 2: IT SUPPORT MANAGER IS INVALID
         *
         * IMPORTANT:
         *
         * The master condition checks:
         *
         *     itSupportManager == ''
         *
         * which means the value is completely empty.
         *
         * This branch checks:
         *
         *     itSupportManager == ' '
         *
         * which means the value contains exactly one space character.
         *
         * Those are different values.
         *
         * As currently written, a truly empty IT Support Manager may cause the
         * master condition to block submission, but this particular modal may
         * not display.
         *
         * This probably should be:
         *
         *     itSupportManager == ''
         *
         * However, the functional code below has been left unchanged.
         */
        } else if (itSupportManager == ' ') {

            /*
             * Open the IT Support Manager error modal.
             */
            spModal.open({
                'title': 'IT Support manager must be updated',

                'message': 'IT Support Manager (CI Owner) must be updated in AppLab before submitting a Cloud Intake Request (CIR).  Please correct within APM# and re-submit after all APM# fields are finalized.',

                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                'backdrop': 'static'

            /*
             * After the user clicks the modal button, this callback runs.
             */
            }).then(function(ans) {

                /*
                 * Check whether the selected button was labeled OK.
                 */
                if (ans.label == 'OK') {

                    /*
                     * No action currently occurs after OK is clicked.
                     */
                    // alert('party');
                }
            });


        /*
         * ERROR 3: COST CENTER MANAGER IS EMPTY OR PROHIBITED
         *
         * This branch runs when:
         *
         * 1. There is no Cost Center Manager, OR
         * 2. The Cost Center Manager matches the prohibited sys_id below.
         */
        } else if (
            costCenterManager == '' ||
            costCenterManager == '86639313dba82810efd51fe968961995'
        ) {

            /*
             * Open the invalid Cost Center modal.
             */
            spModal.open({
                'title': 'Cost Center must be updated',

                'message': 'An invalid selected Cost Center is associated with your APM.  Please update to a valid cost center in order to submit your cloud intake request.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',

                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                'backdrop': 'static'

            /*
             * Run this function after the modal interaction finishes.
             */
            }).then(function(ans) {
                if (ans.label == 'OK') {

                    /*
                     * No additional action is currently performed.
                     */
                    // alert('party');
                }
            });


        /*
         * ERROR 4: APPLICATION OWNER IS INACTIVE
         *
         * This branch runs when application_owner_is_active contains the
         * string 'false'.
         *
         * It does not directly check the Application Owner user record here.
         * It relies on the hidden or calculated variable being accurate.
         */
        } else if (appOwnerflag == 'false') {

            spModal.open({
                'title': 'Application Owner must be updated',

                'message': 'Application owner associated with your APM is inactive.  Please update to a valid Application owner in order to submit your cloud intake request.',

                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                'backdrop': 'static'

            }).then(function(ans) {

                /*
                 * This confirms that the OK button was selected, but there is
                 * no active follow-up action.
                 */
                if (ans.label == 'OK') {
                    // alert('party');
                }
            });


        /*
         * ERROR 5: COST CENTER MANAGER IS INACTIVE
         *
         * This branch runs when cost_center_manager_is_active contains the
         * string 'false'.
         *
         * Like the Application Owner check, this relies on the corresponding
         * active-status variable being populated correctly before submission.
         */
        } else if (ccManagerflag == 'false') {

            spModal.open({
                'title': 'Invalid Cost Center',

                'message': 'Cost Center update required as the current cost center cannot be used for cloud expenses.  The associated Cost Center manager is currently showing as an inactive associate.  Update to the Cost Center and/or Cost Center Manager must be resolved before a CIR can be submitted.  Please reach out to your ELV Finance associate for any CC Q/A and partner our Cloud Intake admins to assist if needed.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',

                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                'backdrop': 'static'

            }).then(function(ans) {
                if (ans.label == 'OK') {

                    /*
                     * No additional code runs when the user clicks OK.
                     */
                    // alert('party');
                }
            });


        /*
         * ERROR 6: INVALID COST CENTER NUMBER OR PROHIBITED MANAGER
         *
         * This final validation branch groups three conditions together.
         *
         * It runs when:
         *
         * 1. The displayed Cost Center number begins with 9.
         *
         * OR
         *
         * 2. The Cost Center Manager matches the first prohibited sys_id.
         *
         * OR
         *
         * 3. The Cost Center Manager matches the second prohibited sys_id.
         */
        } else if (
            costCenterNumber.startsWith('9') ||
            costCenterManager == 'a26fd0b3933f79504e67fcb86cba10df' ||
            costCenterManager == 'fc59fa130fb9310039190bcce1050e59'
        ) {

            /*
             * Example of the Cost Center check:
             *
             * Assume:
             *
             *     costCenterNumber = '912345'
             *
             * Then:
             *
             *     costCenterNumber.startsWith('9')
             *
             * evaluates to true.
             *
             * The script opens the Invalid CC modal and blocks submission.
             *
             * If:
             *
             *     costCenterNumber = '812345'
             *
             * then startsWith('9') evaluates to false.
             *
             * The script would only enter this branch if one of the two manager
             * sys_id checks were true.
             */
            spModal.open({
                'title': 'Invalid CC error notice.',

                'message': 'Invalid cost center has been associated with your selected Business Application - APM# for this CIR submission. Cost Center must be approved for cloud expenses. Please save your CIR submission as a template to save progress in Central Intake, update with a valid cost center within AppLab - APM#, and re-open Central Intake to submit your Cloud Intake Request.For more information, visit the <a href="https://confluence.elevancehealth.com/pages/viewpage.action?pageId=1857990934&spaceKey=ENTCLOUD&title=Cloud%2BIntake%2BRequest%2BCIR%2B%E2%80%93%2BCost%2BCenter%2BValidation%2BError%2BHandling" target="_blank">Cloud Intake Request (CIR) – Cost Center Validation Error Handling</a> page.',

                'buttons': [{
                    label: 'OK',
                    primary: true
                }],

                'backdrop': 'static'

            }).then(function(ans) {

                /*
                 * This function runs after the user clicks the modal button.
                 */
                if (ans.label == 'OK') {

                    /*
                     * Because this alert is commented out, clicking OK simply
                     * closes the modal.
                     */
                    // alert('party');
                }
            });
        }


    /*
     * SECTION 12: ALL VALIDATIONS PASSED
     *
     * This else block belongs to the large master if statement.
     *
     * It runs only when every invalid condition is false.
     *
     * That means:
     *
     * - Cost Center is populated.
     * - IT Support Manager is populated.
     * - Cost Center Manager is populated.
     * - Cost Center Manager is not one of the prohibited users.
     * - Application Owner is active.
     * - Cost Center Manager is active.
     * - Cost Center number does not start with 9.
     */
    } else {

        /*
         * Change flag from false to true.
         *
         * This tells ServiceNow that submission is allowed.
         */
        flag = true;
    }


    /*
     * SECTION 13: RETURN THE FINAL DECISION
     *
     * ServiceNow receives the value of flag.
     *
     * If flag is false:
     *
     *     The submission is canceled.
     *
     * If flag is true:
     *
     *     The catalog item proceeds with submission.
     */
    return flag;
}