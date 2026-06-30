// CREATE ENDPOINT

(function process( /*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var LOG_SOURCE = 'UCP_Request_API';

    // ─── 1. Parse Body ───────────────────────────────────────────────────────
    var body = request.body.data;

    if (!body) {
        response.setStatus(400);
        response.setBody({
            error: 'Request body is missing or not valid JSON.'
        });
        return;
    }

    var recipient = body.recipient || '';
    var apmId = body.apm_id || '';
    var medal = body.medal || '';
    var provider = body.provider || '';
    var appOwnerUserId = body.app_owner || '';
    var summary = body.summary_of_the_request || '';
    var description = body.detailed_description_of_the_request || '';
    var approvalRequired = body.approval_required || '';
    var sourceApprovalUsers = (body.source_approver || '').toString();
	var destinationApprovalUsers = (body.destination_approver || '').toString();
    // var approvalGroup = body.approval_group || '';

    // ── Catalog Item sys_id ──────────────────────────────────────────────────
    var CATALOG_ITEM_SYS_ID = '0ca11dec2b748b50b406f46c6e91bfcd';

    // ─── 2. Resolve recipient → sys_user ─────────────────────────────────────
    var recipientSysId = resolveUserByUserId(recipient);
    if (!recipientSysId) {
        response.setStatus(400);
        response.setBody({
            error: 'Recipient user not found: ' + recipient
        });
        return;
    }

    // ─── 3. Resolve app_owner → sys_user ─────────────────────────────────────
    var appOwnerSysId = resolveUserByUserId(appOwnerUserId);
    if (!appOwnerSysId) {
        response.setStatus(400);
        response.setBody({
            error: 'App owner user not found: ' + appOwnerUserId
        });
        return;
    }

    // ─── 4. Resolve apm_id → cmdb_ci_business_app ────────────────────────────
    var apmSysId = resolveApmId(apmId);
    if(!apmSysId) {
        response.setStatus(400);
        response.setBody({
            error : 'APM Record not found: ' + apmId
        });
        return;
    }
    
    
    if (!apmSysId) {
        gs.warn(LOG_SOURCE + ' | APM record not found for: ' + apmId + '. Storing raw value.');
    }

    // ---- 5. Get Source Approval Users ----------------------------------------
    var sagr = new GlideRecord('sys_user');
    sagr.addQuery('user_name', 'IN', sourceApprovalUsers);
    sagr.query();
    var saSysIds = [];
    while (sagr.next()) {
        saSysIds.push(sagr.getUniqueValue());
    }
    var approvalUserSysIds = saSysIds.join(',');
    gs.info('Resolved sys_ids: ' + approvalUserSysIds);

	// ---- 6. Get Destination Approval Users ------------------------------------
    var dagr = new GlideRecord('sys_user');
    dagr.addQuery('user_name', 'IN', destinationApprovalUsers);
    dagr.query();
    var daSysIds = [];
    while (dagr.next()) {
        daSysIds.push(dagr.getUniqueValue());
    }
    var destApprovalUserSysIds = daSysIds.join(',');
    gs.info('Resolved sys_ids: ' + destApprovalUserSysIds);

    // ─── 5. CartJS orderNow ───────────────────────────────────────────────────
    try {
        var cartName = 'cart_' + gs.generateGUID();
        var cart = new sn_sc.CartJS(cartName);

        var requestBodyCart = {
            'sysparm_id': CATALOG_ITEM_SYS_ID,
            'sysparm_quantity': '1',
            'sysparm_requested_for': recipientSysId,
            'sysparm_cart_name': cartName,
            'variables': {
                'recipient': recipientSysId,
                'apm_id': apmSysId || apmId,
                'medal': medal,
                'provider': provider,
                'app_owner': appOwnerSysId,
                'summary_of_the_request': summary,
                'detailed_description_of_the_request': description,
                'requires_approval': approvalRequired,
                'source_approver': approvalUserSysIds,
				'destination_approver' : destApprovalUserSysIds
            }
        };

        var requestDetails = cart.orderNow(requestBodyCart);

        if (!requestDetails) {
            response.setStatus(500);
            response.setBody({
                error: 'orderNow returned empty — catalog item sys_id may be invalid.'
            });
            return;
        }

        // ─── 6. Extract Request + RITM ────────────────────────────────────────
        var requestSysId = requestDetails.sys_id;
        var requestNumber = requestDetails.number;

        var ritmGR = new GlideRecord('sc_req_item');
        ritmGR.addQuery('request', requestSysId);
        ritmGR.setLimit(1);
        ritmGR.query();

        if (!ritmGR.next()) {
            response.setStatus(500);
            response.setBody({
                error: 'Request created but RITM not found. Request: ' + requestNumber
            });
            return;
        }

        var ritmSysId = ritmGR.getValue('sys_id');
        var ritmNumber = ritmGR.getValue('number');


        // ─── 8. Respond ───────────────────────────────────────────────────────
        response.setStatus(200);
        response.setBody({
            status: 'success',
            req_id: requestNumber,
            ritm_id: ritmNumber,
            message : "Request created successfully"
        });

    } catch (e) {
        gs.error(LOG_SOURCE + ' | CartJS error: ' + e.message);
        response.setStatus(500);
        response.setBody({
            error: 'Failed to create request: ' + e.message
        });
    }


    // ═════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═════════════════════════════════════════════════════════════════════════

    function resolveUserByUserId(userId) {
        if (!userId) return null;
        var gr = new GlideRecord('sys_user');
        gr.addQuery('user_name', userId);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr.getValue('sys_id') : null;
    }



    function resolveApmId(apmId) {
        if (!apmId) return null;
        var gr = new GlideRecord('cmdb_ci_business_app');
        gr.addQuery('number', apmId);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr.getValue('sys_id') : null;
    }

    function getManagerSysId(userSysId) {
        var gr = new GlideRecord('sys_user');
        return gr.get(userSysId) ? gr.getValue('manager') : null;
    }

    function getGroupSysId(groupName) {
        var gr = new GlideRecord('sys_user_group');
        gr.addQuery('name', groupName);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr.getValue('sys_id') : null;
    }

})(request, response);


// UPDATE ENDPOINT

(function process(request, response) {

    try {

        var body = request.body.data;

        if (!body.number || !body.state) {
            response.setStatus(400);
            return { error: "number and state are required" };
        }

        var gr = new GlideRecord('sc_task');
        gr.addQuery('number', body.number);
        gr.query();

        if (!gr.next()) {
            response.setStatus(404);
            return { error: "Task not found" };
        }

        gr.state = body.state;
        gr.close_notes = body.close_notes || '';
		
		var ritm = new GlideRecord('sc_req_item');
		ritm.addQuery('sys_id', gr.request_item.toString());
		ritm.query();

		if(ritm.next()) {
			ritm.state = body.state;
			ritm.update();
		} else {
			response.setStatus(404);
            return { error: "Request Item not found" };
		}

		var req = new GlideRecord('sc_request');
		req.addQuery('sys_id', gr.request_item.request.toString());
		req.query();

		if(req.next()) {
			req.state = body.state;
			req.update();
		} else {
			response.setStatus(404);
            return { error: "Request not found" };
		}

        gr.update();

        response.setStatus(200);
        return {
            message: "Task updated successfully",
            sctask_id: gr.number.toString()
        };

    } catch (e) {

        gs.error("REST API Error: " + e.message);

        response.setStatus(500);
        return {
            error: e.message
        };
    }

})(request, response);


(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    // Used as a consistent source label for system logs.
    // This makes it easier to filter logs related to this API.
    var LOG_SOURCE = 'UCP_Request_API';

    // ─── 1. Parse Body ───────────────────────────────────────────────────────
    // Scripted REST API request body.
    // In ServiceNow, request.body.data contains the parsed JSON object when the
    // inbound request Content-Type is application/json.
    var body = request.body.data;

    // If no valid JSON body was provided, stop immediately and return HTTP 400.
    // This prevents the rest of the script from running with undefined values.
    if (!body) {
        response.setStatus(400);
        response.setBody({
            error: 'Request body is missing or not valid JSON.'
        });
        return;
    }

    // Pull expected values from the JSON body.
    // Each value falls back to an empty string so later logic does not throw errors
    // if a property is missing from the payload.
    var recipient = body.recipient || '';
    var apmId = body.apm_id || '';
    var medal = body.medal || '';
    var provider = body.provider || '';
    var appOwnerUserId = body.app_owner || '';
    var summary = body.summary_of_the_request || '';
    var description = body.detailed_description_of_the_request || '';
    var approvalRequired = body.approval_required || '';

    // These are expected to be comma-separated user_name values, for example:
    // "AM68888,AM66845"
    // They are converted to strings so they can be used in an IN query below.
    var sourceApprovalUsers = (body.source_approver || '').toString();
    var destinationApprovalUsers = (body.destination_approver || '').toString();

    // var approvalGroup = body.approval_group || '';

    // ── Catalog Item sys_id ──────────────────────────────────────────────────
    // This is the sys_id of the catalog item this API will submit through CartJS.
    // Current catalog item: UCP Approval Form / target request catalog item.
    var CATALOG_ITEM_SYS_ID = '0ca11dec2b748b50b406f46c6e91bfcd';

    // ─── 2. Resolve recipient → sys_user ─────────────────────────────────────
    // The payload sends recipient as a user_name, not a sys_id.
    // Catalog variables/reference fields usually need the sys_user sys_id.
    var recipientSysId = resolveUserByUserId(recipient);

    // If the recipient cannot be found, stop the request.
    // The catalog item cannot be submitted correctly without Requested For.
    if (!recipientSysId) {
        response.setStatus(400);
        response.setBody({
            error: 'Recipient user not found: ' + recipient
        });
        return;
    }

    // ─── 3. Resolve app_owner → sys_user ─────────────────────────────────────
    // The app owner is also provided as a user_name and must be converted
    // to a sys_user sys_id before being passed into the catalog item.
    var appOwnerSysId = resolveUserByUserId(appOwnerUserId);

    // If app_owner is invalid, stop and return a clear error.
    if (!appOwnerSysId) {
        response.setStatus(400);
        response.setBody({
            error: 'App owner user not found: ' + appOwnerUserId
        });
        return;
    }

    // ─── 4. Resolve apm_id → cmdb_ci_business_app ────────────────────────────
    // The payload sends an APM application number, such as "apm1081784".
    // This helper attempts to find the matching cmdb_ci_business_app record.
    var apmSysId = resolveApmId(apmId);

    // If the APM record cannot be found, the request cannot continue.
    // Return an HTTP 400 (Bad Request) indicating that the supplied APM ID
    // does not exist in the instance.
    if (!apmSysId) {
        response.setStatus(400);
        response.setBody({
            error: 'APM Record not found: ' + apmSysId
        });
        return;
    }

    // ---- 5. Get Source Approval Users ----------------------------------------
    // Query sys_user for all users whose user_name is in the source approver list.
    // The result is converted into a comma-separated sys_id string so it can be
    // passed into a List Collector / Glide List style catalog variable.
    var sagr = new GlideRecord('sys_user');
    sagr.addQuery('user_name', 'IN', sourceApprovalUsers);
    sagr.query();

    var saSysIds = [];

    while (sagr.next()) {
        saSysIds.push(sagr.getUniqueValue());
    }

    // Comma-separated sys_id list for the source_approver variable.
    var approvalUserSysIds = saSysIds.join(',');
    gs.info('Resolved sys_ids: ' + approvalUserSysIds);

    // ---- 6. Get Destination Approval Users ------------------------------------
    // Same logic as source approvers, but for destination approvers.
    var dagr = new GlideRecord('sys_user');
    dagr.addQuery('user_name', 'IN', destinationApprovalUsers);
    dagr.query();

    var daSysIds = [];

    while (dagr.next()) {
        daSysIds.push(dagr.getUniqueValue());
    }

    // Comma-separated sys_id list for the destination_approver variable.
    var destApprovalUserSysIds = daSysIds.join(',');
    gs.info('Resolved sys_ids: ' + destApprovalUserSysIds);

    // ─── 7. CartJS orderNow ───────────────────────────────────────────────────
    try {
        // Create a unique cart name for this API transaction.
        // This avoids collisions with a user's normal Service Catalog cart.
        var cartName = 'cart_' + gs.generateGUID();

        // CartJS is used to programmatically submit a catalog item.
        var cart = new sn_sc.CartJS(cartName);

        // Build the CartJS orderNow request body.
        // sysparm_id = catalog item sys_id.
        // sysparm_requested_for = requested for user.
        // variables = catalog item variable names and values.
        var requestBodyCart = {
            'sysparm_id': CATALOG_ITEM_SYS_ID,
            'sysparm_quantity': '1',
            'sysparm_requested_for': recipientSysId,
            'sysparm_cart_name': cartName,
            'variables': {
                'recipient': recipientSysId,
                'apm_id': apmSysId || apmId,
                'medal': medal,
                'provider': provider,
                'app_owner': appOwnerSysId,
                'summary_of_the_request': summary,
                'detailed_description_of_the_request': description,
                'requires_approval': approvalRequired,
                'source_approver': approvalUserSysIds,
                'destination_approver': destApprovalUserSysIds
            }
        };

        // Submit the catalog item.
        // This creates the REQ and associated RITM.
        var requestDetails = cart.orderNow(requestBodyCart);

        // If CartJS returns nothing, the submission failed.
        // Most likely causes: invalid catalog item sys_id, inaccessible item,
        // bad variable names, or catalog item validation issues.
        if (!requestDetails) {
            response.setStatus(500);
            response.setBody({
                error: 'orderNow returned empty — catalog item sys_id may be invalid.'
            });
            return;
        }

        // ─── 8. Extract Request + RITM ────────────────────────────────────────
        // CartJS returns request-level details.
        // We capture the REQ sys_id and number first.
        var requestSysId = requestDetails.sys_id;
        var requestNumber = requestDetails.number;

        // Query the Requested Item created under the request.
        // Since this API submits one catalog item at quantity 1, we expect one RITM.
        var ritmGR = new GlideRecord('sc_req_item');
        ritmGR.addQuery('request', requestSysId);
        ritmGR.setLimit(1);
        ritmGR.query();

        // If the REQ was created but no RITM is found, return an error.
        // This indicates the catalog submission was incomplete or unexpected.
        if (!ritmGR.next()) {
            response.setStatus(500);
            response.setBody({
                error: 'Request created but RITM not found. Request: ' + requestNumber
            });
            return;
        }

        // Capture RITM identifiers for the API response.
        var ritmSysId = ritmGR.getValue('sys_id');
        var ritmNumber = ritmGR.getValue('number');

        // ─── 9. Respond ───────────────────────────────────────────────────────
        // Return success response with the REQ and RITM numbers.
        response.setStatus(200);
        response.setBody({
            status: 'success',
            req_id: requestNumber,
            ritm_id: ritmNumber,
            message: 'Request created successfully'
        });

    } catch (e) {
        // Catch any unexpected error from CartJS or the surrounding logic.
        // Log the error server-side and return HTTP 500 to the API caller.
        gs.error(LOG_SOURCE + ' | CartJS error: ' + e.message);

        response.setStatus(500);
        response.setBody({
            error: 'Failed to create request: ' + e.message
        });
    }


    // ═════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═════════════════════════════════════════════════════════════════════════

    // Looks up a sys_user record by user_name.
    // Example input: "AM68888"
    // Returns: sys_user.sys_id if found, otherwise null.
    function resolveUserByUserId(userId) {
        if (!userId) return null;

        var gr = new GlideRecord('sys_user');
        gr.addQuery('user_name', userId);
        gr.setLimit(1);
        gr.query();

        return gr.next() ? gr.getValue('sys_id') : null;
    }


    // Looks up a Business Application record by its number.
    // Example input: "apm1081784"
    // Table: cmdb_ci_business_app
    // Returns: business application sys_id if found, otherwise null.
    function resolveApmId(apmId) {
        if (!apmId) return null;

        var gr = new GlideRecord('cmdb_ci_business_app');
        gr.addQuery('number', apmId);
        gr.setLimit(1);
        gr.query();

        return gr.next() ? gr.getValue('sys_id') : null;
    }

    // Looks up the manager sys_id for a given user sys_id.
    // Currently not used in the main logic, but available if future approval
    // routing needs to derive the requester's manager.
    function getManagerSysId(userSysId) {
        var gr = new GlideRecord('sys_user');
        return gr.get(userSysId) ? gr.getValue('manager') : null;
    }

    // Looks up a group sys_id by group name.
    // Currently not used in the main logic, but available if future approval
    // routing needs to resolve approval groups by name.
    function getGroupSysId(groupName) {
        var gr = new GlideRecord('sys_user_group');
        gr.addQuery('name', groupName);
        gr.setLimit(1);
        gr.query();

        return gr.next() ? gr.getValue('sys_id') : null;
    }

})(request, response);