var TaskUtilsSNC = Class.create();
TaskUtilsSNC.prototype = {

	TABLE: {
		TASK: 'task',
		CMDB_CI: 'cmdb_ci',
		TASK_CI: 'task_ci',
		TASK_CMDB_CI_SERVICE: 'task_cmdb_ci_service',
		TASK_SERVICE_OFFERING: 'task_service_offering',
		TASK_CI_GROUP_ASSOC: 'task_ci_dynamic_group_association'
	},

	FIELD: {
		CI_ITEM: 'ci_item',
		CMDB_CI: 'cmdb_ci',
		TASK_CI: 'task_ci',
		DYNAMIC_CI_GROUP: 'cmdb_ci_query_based_service',
		BUSINESS_SERVICE: 'business_service',
		SERVICE_OFFERING: 'service_offering',
		SERVICE_CLASSIFICATION: 'service_classification'
	},

	CI_TYPE: {
		CMDB_CI_SERVICE: 'cmdb_ci_service',
		SERVICE_OFFERING: 'service_offering',
		DYNAMIC_CI_GROUP: 'cmdb_ci_query_based_service'
	},

	PROPERTIES : {
		PRINCIPAL_CLASS_FILTER_PROPERTY: 'com.snc.task.principal_class_filter',
		RUN_REFRESH_AS_EVENT: '.refresh_impacted.event',
		REFRESH_IMPACTED_SERVICES_MESSAGE_SHOW: '.refresh_impacted_services.message.show',
		ASSOCIATE_BY_CI_CLASS_TYPE_EXTENSION: '.associate_by_ci_class_type_extension',
		POLARIS_EXPERIENCE : 'glide.ui.polaris.experience'
	},

	PLUGINS: {
		SPM: 'com.snc.service_portfolio_core'
	},

	CONSTANTS: {
		OPS_FILTER_CLASSNAMES: ['incident', 'problem'], // task types for which the operational status filter will be applied
		TRACKER_NAME: 'Unpack Dynamic CI Group',
		TRACKER_SCRIPT: 'TaskUtils',
		MUTEX_PREFIX: 'task_ci_',
		MUTEX_WAIT: 5000,
		MUTEX_SPIN: 60,
		APP_SERVICE: 'Application Service'
	},

	LOGS: {
		MANUAL_LOG: 'com.snc.change_management.manual_association_ci.log',
		DYNAMIC_LOG: 'com.snc.change_management.affected_ci.dynamic_group.log',
		REFRESH_SVCS_LOG: 'com.snc.task.refresh_impacted_services.log'
	},

	initialize: function() {
		this.manualLog = new GSLog(this.LOGS.MANUAL_LOG, this.type).setLog4J();
		this.dynamicLog = new GSLog(this.LOGS.DYNAMIC_LOG, this.type).setLog4J();
		this.refreshLog = new GSLog(this.LOGS.REFRESH_SVCS_LOG, this.type).setLog4J();
	},

	assocCiToTaskByCiClass: function(taskSysId, ciSysIds) {
		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[assocCiToTaskByCiClass] taskSysId: ' + taskSysId + ' ciSysIds: ' + ciSysIds);

		var result = this._getAssocResultObj(taskSysId);
		if (!result.validTask)
			return result;

		var assocByCiClass = this._getAssocByCiClass(result.taskGr);
		var taskTable = result.taskGr.getValue('sys_class_name');

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[assocCiToTaskByCiClass] assocByCiClass: ' + assocByCiClass);

		ciSysIds.map(function(ciSysId) {
			var cmdbCiGr = this.getCmdbCiGr(ciSysId);
			if (cmdbCiGr && cmdbCiGr.getUniqueValue()) {
				var assocTablename = assocByCiClass ? this.getAssociationType(cmdbCiGr) : this._getAssociationTypeLegacy(cmdbCiGr);
				var assocField = this.getAssocField(assocTablename);
				var cmdbCiDisplayValue = GlideStringUtil.escapeHTML(cmdbCiGr.getDisplayValue());
				var taskDisplayValue = GlideStringUtil.escapeHTML(result.taskGr.getDisplayValue());

				if (assocTablename && assocField) {
					var gr = new GlideRecord(assocTablename);
					gr.addQuery(this.TABLE.TASK, taskSysId);
					gr.addQuery(assocField, ciSysId);
					gr.query();
					if (gr.next())
						result.errors.push(gs.getMessage('Association of type: {0} between CI: {1} and {2}: {3} already exists', [
							assocTablename,
							cmdbCiDisplayValue,
							sys_meta[taskTable].sys_meta.label,
							taskDisplayValue
						]));
					else if (!gr.canCreate())
						result.errors.push(gs.getMessage('Association of type: {0} between CI: {1} and {2}: {3} is not permitted', [
							assocTablename,
							cmdbCiDisplayValue,
							sys_meta[taskTable].sys_meta.label,
							taskDisplayValue
						]));
					else {
						gr.initialize();
						gr.setValue(this.TABLE.TASK, taskSysId);
						gr.setValue(assocField, ciSysId);
						var assocSysId = gr.insert();

						if (this.manualLog.atLevel(GSLog.DEBUG))
							this.manualLog.debug('[assocCiToTaskByCiClass] assocSysId: ' + assocSysId);
	
						if (assocSysId)
							this._incrementCounters(result, assocTablename);
						else
							result.errors.push(gs.getMessage('Association of type: {0} between CI: {1} and {2}: {3} failed', [
								assocTablename,
								cmdbCiDisplayValue,
								sys_meta[taskTable].sys_meta.label,
								taskDisplayValue
							]));
					}
				}
			} else
				result.errors.push(gs.getMessage('invalid cmdb_ci sys_id: {0}', [ciSysId]));
		}, this);

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[assocCiToTaskByCiClass] result: ' + JSON.stringify(result));

		return result;
	},

	// cmdbCi can be cmdb_ci sysId or gliderecord
	getCmdbCiGr: function(cmdbCi) {
		if (!cmdbCi)
			return null;

		var cmdbCiGr = cmdbCi;
		if (typeof cmdbCi === 'string') {
			cmdbCiGr = new GlideRecord(this.TABLE.CMDB_CI);
			if (!cmdbCiGr.get(cmdbCi))
				return null;
		}

		return cmdbCiGr;
	},

	_getAssocResultObj: function(taskSysId) {
		var result = {
			processedCount: 0,
			impactedServiceCount: 0,
			affectedCICount: 0,
			serviceOfferingCount: 0,
			validTask: false,
			errors: [],
			taskGr: null
		};

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[_getAssocResultObj] taskSysId: ' + taskSysId);

		if (!taskSysId)
			return result;

		var taskGr = new GlideRecord(this.TABLE.TASK);
		if (!taskGr.get(taskSysId) || !taskGr.canRead())
			return result;

		result.validTask = true;
		result.taskGr = taskGr;

		return result;
	},

	_incrementCounters: function(result, assocTablename) {
		switch(assocTablename) {
			case this.TABLE.TASK_SERVICE_OFFERING:
				result.serviceOfferingCount++;
				result.processedCount++;
				break;
			case this.TABLE.TASK_CMDB_CI_SERVICE:
				result.impactedServiceCount++;
				result.processedCount++;
				break;
			case this.TABLE.TASK_CI:
				result.affectedCICount++;
				result.processedCount++;
				break;
			default:
				break;
		}
		return result;
	},

	getAssocField: function(tablename) {
		switch(tablename) {
			case this.TABLE.TASK_SERVICE_OFFERING:
				return this.CI_TYPE.SERVICE_OFFERING;
			case this.TABLE.TASK_CMDB_CI_SERVICE:
				return this.CI_TYPE.CMDB_CI_SERVICE;
			case this.TABLE.TASK_CI:
				return this.FIELD.CI_ITEM;
			default:
				return null;
		}
	},

	getCiTaskField: function(cmdbCi, taskGr) {
		var sysClassName = this._getCmdbCiClassName(cmdbCi);
		if (!sysClassName)
			return null;

		var assocByCiClass = this._getAssocByCiClass(taskGr);

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[getCiTaskField] assocByCiClass: ' + assocByCiClass);

		if (!assocByCiClass)
			return this.FIELD.CMDB_CI;

		if (GlideDBObjectManager.get().getAllExtensions(this.CI_TYPE.SERVICE_OFFERING).indexOf(sysClassName) !== -1)
			return this.FIELD.SERVICE_OFFERING;
		else if (GlideDBObjectManager.get().getAllExtensions(this.CI_TYPE.CMDB_CI_SERVICE).indexOf(sysClassName) !== -1)
			return this.FIELD.BUSINESS_SERVICE;
		else
			return this.FIELD.CMDB_CI;
	},

	getAssociationType: function(cmdbCi) {
		var sysClassName = this._getCmdbCiClassName(cmdbCi);
		if (!sysClassName)
			return null;

		if (GlideDBObjectManager.get().getAllExtensions(this.CI_TYPE.SERVICE_OFFERING).indexOf(sysClassName) !== -1)
			return this.TABLE.TASK_SERVICE_OFFERING;
		else if (GlideDBObjectManager.get().getAllExtensions(this.CI_TYPE.CMDB_CI_SERVICE).indexOf(sysClassName) !== -1)
			return this.TABLE.TASK_CMDB_CI_SERVICE;
		else
			return this.TABLE.TASK_CI;
	},

	_getAssociationTypeLegacy: function(cmdbCi) {
		return this._getCmdbCiClassName(cmdbCi) === 'cmdb_ci_service' ? this.TABLE.TASK_CMDB_CI_SERVICE : this.TABLE.TASK_CI;
	},

	_getAssocByCiClass: function(taskGr) {
		if (!taskGr)
			return false;
		
		var sysClassName = taskGr.getValue('sys_class_name');
		if (!sysClassName)
			return false;

		var assocByCiClassProperty = 'com.snc.' + sysClassName + this.PROPERTIES.ASSOCIATE_BY_CI_CLASS_TYPE_EXTENSION;

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[getCiTaskField] assocByCiClassProperty: ' + assocByCiClassProperty);

		var assocByCiClass = gs.getProperty(assocByCiClassProperty, 'false') + '' === 'true';

		if (this.manualLog.atLevel(GSLog.DEBUG))
			this.manualLog.debug('[getCiTaskField] assocByCiClass: ' + assocByCiClass);

		return assocByCiClass;
	},

	_getCmdbCiClassName: function(cmdbCi) {
		var cmdbCiGr = this.getCmdbCiGr(cmdbCi);
		return cmdbCiGr ? cmdbCiGr.getValue('sys_class_name') : null;
	},

	getConfigurationItemFilter: function(current) {
		if (!current) {
			gs.error("[TaskUtilsSNC.getConfigurationItemFilter] : Invalid parameter");
			return;
		}

		var configItemFilter = '';
		var serviceOfferingFilter = 'sys_class_name!=service_offering';

		configItemFilter += serviceOfferingFilter;

		if (this.CONSTANTS.OPS_FILTER_CLASSNAMES.indexOf(current.sys_class_name + '') > -1)
			configItemFilter += "^operational_statusNOT IN" + new OpsStatusFilter('cmdb_ci').by('CreateTask').join();

		var principalClassFilter = this.getPCFilterEvaluated(current.sys_class_name + '');
		if (principalClassFilter.length > 0)
			configItemFilter += '^' + principalClassFilter;

		return configItemFilter;
	},

	getPCFilterEvaluated: function (className) {
		var pcFilterProperty = gs.getProperty(this.PROPERTIES.PRINCIPAL_CLASS_FILTER_PROPERTY, '');
		if (pcFilterProperty.length > 0 && pcFilterProperty.split(',').indexOf(className) > -1) {
			var principalClasses = new PrincipalClass().getPrincipalClasses().join(',');
			if (principalClasses.length > 0)
				return "sys_class_nameIN" + principalClasses;
		}
		return '';
	},

	refreshRelatedLists: function(task) {
		if (!task)
			return;

		var sysId = task.getUniqueValue();
		var services = [];

		var servicesGr = new GlideRecord('task_cmdb_ci_service');
		servicesGr.addQuery('task', sysId);
		servicesGr.query();

		while (servicesGr.next())
			services.push(servicesGr.cmdb_ci_service + "");

		//Check if Service Portfolio is active and enabled
		if (GlidePluginManager.isActive(this.PLUGINS.SPM)) {
			var tOffering = new TaskOffering();
			if (tOffering.canPopulateServiceOfferings(task.getRecordClassName())) {
				tOffering.removeServiceOffering(sysId);
				tOffering.addServiceOffering(sysId, services);
			}
		}

		var tBusApps = new TaskBusinessApp();
		if (tBusApps.canPopulateBusinessApplications(task.getRecordClassName())) {
			tBusApps.removeBusinessApplications(sysId);
			tBusApps.addBusinessApplications(sysId, services);
		}
	},

	getManuallyAddedRecords: function(taskSysId, targetTable, targetField) {
		var manualServices = [];

		if (!taskSysId || !targetTable || !targetField)
			return manualServices;

		var manualServicesGr = new GlideRecord(targetTable);
		manualServicesGr.addQuery('task', taskSysId);
		manualServicesGr.addQuery('manually_added', true);
		manualServicesGr.query();

		while (manualServicesGr.next())
			manualServices.push(manualServicesGr.getValue(targetField) + "");
	
		return manualServices;
	},

	_getRecordsJSON: function(taskSysId, targetTable) {
		var records = {};

		if (!taskSysId || !targetTable)
			return records;

		var recordGr = new GlideRecord(targetTable);
		recordGr.addQuery('task', taskSysId);
		recordGr.query();

		while (recordGr.next())
			records[recordGr.getValue(this.FIELD.CI_ITEM)] = recordGr.getUniqueValue();
	
		return records;
	},

	_createCIGroupAssoc: function(recordId, groupId) {
		var recordGr = new GlideRecord(this.TABLE.TASK_CI_GROUP_ASSOC);
		recordGr.initialize();
		recordGr.setValue('task_ci', recordId);
		recordGr.setValue('cmdb_ci_query_based_service', groupId);
		recordGr.insert();
	},

	unpackDynamicGroup: function(recordId, userId) {
		if (!recordId) {
			if (this.dynamicLog.atLevel(GSLog.DEBUG))
				this.dynamicLog.debug("[deleteUnpackedCIs] No Task Id has been supplied");
			return;
		}

		var taskCIGR = new GlideRecord(this.TABLE.TASK_CI);
		if (!taskCIGR.get(recordId)) { 
			if (this.dynamicLog.atLevel(GSLog.DEBUG))
				this.dynamicLog.debug("[unpackDynamicGroup] Unable to retrieve task_ci for ID: " + recordId);
			return;
		}

		var mutex = new GlideSelfCleaningMutex(this.CONSTANTS.MUTEX_PREFIX + taskCIGR.task);
		mutex.setSpinWait(this.CONSTANTS.MUTEX_WAIT);
		mutex.setMaxSpins(this.CONSTANTS.MUTEX_SPIN);
		if (mutex.get()) {
			try {
				this._UnpackDynamicGroupMutex(taskCIGR, userId);
			} finally {
				mutex.release();
			}
		} else {
			gs.info('[unpackDynamicGroup] Failed to acquire mutex for in task ' + taskCIGR.task);
		}
	},

	_UnpackDynamicGroupMutex: function(taskCIGR, userId) {
		var cmdb = taskCIGR.ci_item.getRefRecord();
		var task = taskCIGR.task.getRefRecord();

		if (cmdb.getTableName() !== this.CI_TYPE.DYNAMIC_CI_GROUP)
			return;

		//Return from unpacking as Application Service groups are not unpacked
		if (cmdb.getValue(this.FIELD.SERVICE_CLASSIFICATION) === this.CONSTANTS.APP_SERVICE)
			return;

		var currentSysId = cmdb.getUniqueValue();
		if (!cmdb.cmdb_group.nil()) {
			if (this.dynamicLog.atLevel(GSLog.DEBUG))
				this.dynamicLog.debug("[unpackDynamicGroup] Getting Cis for CMDB Group: " + cmdb.cmdb_group);

			var parser = new JSONParser();
			var response = sn_cmdbgroup.CMDBGroupAPI.getAllCI(cmdb.cmdb_group, false, true);
			var parsed = parser.parse(response);
			if (parsed.result) {
				if (this.dynamicLog.atLevel(GSLog.DEBUG))
					this.dynamicLog.debug("[unpackDynamicGroup] Retrieved Cis: " + parsed.idList);

				//Get current records to skip duplicates
				var currentCIs = this._getRecordsJSON(task.getUniqueValue(), this.TABLE.TASK_CI);
				var m2m = new GlideRecord(this.TABLE.TASK_CI);
				for (var i = 0; i < parsed.idList.length; i++) {
					var parsedID = parsed.idList[i];
					if (parsedID !== currentSysId) {
						var taskCi = '';
						//If a returned CI is not in list then create affected CI
						if (!currentCIs.hasOwnProperty(parsedID)) {
							m2m.initialize();
							m2m.task = task.getUniqueValue();
							m2m.ci_item = parsedID;
							m2m.added_from_dynamic_ci = currentSysId;
							taskCi = m2m.insert();
							if (!taskCi) {
								//The CI has already been inserted so requery to find the record
								//that might be inserted manually or from another process so need to get id
								//to keep track of its association to dynamic group
								var tskCiGr = new GlideRecord(this.TABLE.TASK_CI);
								tskCiGr.addQuery('task', task.getUniqueValue());
								tskCiGr.addQuery('ci_item', parsedID);
								tskCiGr.query();
								if (tskCiGr.next())
									taskCi = tskCiGr.getUniqueValue();
							}

						} else
							taskCi = currentCIs[parsedID];

						//Create group accociation record for affected ci
						this._createCIGroupAssoc(taskCi, currentSysId);
					}
				}
			} else {
				if (this.dynamicLog.atLevel(GSLog.DEBUG))
					this.dynamicLog.debug("[unpackDynamicGroup] Error getting Cis" + JSON.stringify(parsed.errors));

				gs.error("[TaskUtils.unpackDynamicGroup] : " + JSON.stringify(parsed.errors));
				return;
			}
		} else {
			if (this.dynamicLog.atLevel(GSLog.DEBUG))
				this.dynamicLog.debug("[unpackDynamicGroup] Getting Cis for Dynamic CI Group ID: " + cmdb.getUniqueValue());

			this._insertTaskCIFromDynamicGroup(cmdb, taskCIGR.task);
		}

		if (userId) {
			var msg = gs.getMessage('Loading of CIs on {0} from group {1} is complete ', [task.getDisplayValue('number'), cmdb.getDisplayValue('name')]);
			var title = gs.getMessage("Unpack dynamic CI group");
			this.notifyUser(taskCIGR.task, userId, msg, title);
		}
	},

	deleteUnpackedCIs: function(taskId, groupId, recordId, userId) {
		if (!taskId) {
			if (this.dynamicLog.atLevel(GSLog.DEBUG))
				this.dynamicLog.debug("[deleteUnpackedCIs] No Task Id has been supplied");
			return;
		}

		var mutex = new GlideSelfCleaningMutex(this.CONSTANTS.MUTEX_PREFIX + recordId);
		mutex.setSpinWait(this.CONSTANTS.MUTEX_WAIT);
		mutex.setMaxSpins(this.CONSTANTS.MUTEX_SPIN);
		if (mutex.get()) {
			try {
				this._DeleteUnpackedCIsMutex(taskId, groupId, userId);
			} finally {
				mutex.release();
			}
		} else {
				gs.info('[deleteUnpackedCIs] Failed to acquire mutex for task ' + recordId);
		}
	},

	_DeleteUnpackedCIsMutex: function(taskId, groupId, userId) {
		//Retrieve all task_ci records for group to be deleted
		var ciGroupAssocGr = new GlideAggregate(this.TABLE.TASK_CI_GROUP_ASSOC);
		ciGroupAssocGr.addQuery('task_ci.task', taskId);
		var ciGroupAssocJoin = ciGroupAssocGr.addJoinQuery(this.TABLE.TASK_CI_GROUP_ASSOC, this.FIELD.TASK_CI, this.FIELD.TASK_CI);
		ciGroupAssocJoin.addCondition(this.FIELD.DYNAMIC_CI_GROUP, groupId);
		ciGroupAssocGr.groupBy(this.FIELD.TASK_CI);
		ciGroupAssocGr.addHaving('COUNT', '=', '1');
		ciGroupAssocGr.query();

		var deleteArray = [];
		while (ciGroupAssocGr.next())
			deleteArray.push(ciGroupAssocGr.getValue(this.FIELD.TASK_CI));

		if (deleteArray.length > 0) {
			var taskCIGr = new GlideRecord(this.TABLE.TASK_CI);
			taskCIGr.addQuery('sys_id', 'IN', deleteArray);
			taskCIGr.query();
			taskCIGr.deleteMultiple();
		}

		//Query the cis as this in the group as this will return just the association records
		//that have not been deleted via cascade and the task_ci is in another group
		var groupCiGr = new GlideMultipleDelete(this.TABLE.TASK_CI_GROUP_ASSOC);
		groupCiGr.addQuery('cmdb_ci_query_based_service', groupId);
		groupCiGr.addQuery('task_ci.task', taskId);
		groupCiGr.execute();

		if (userId) {
			var msg = gs.getMessage('Removal of CIs is complete ');
			var title = gs.getMessage("Dynamic CI group");
			this.notifyUser(taskId, userId, msg, title);
		}
	},

	_getRunningWorker: function(recordId) {
		var trackerGr = new GlideRecord("sys_execution_tracker");
		trackerGr.addQuery("source", recordId);
		trackerGr.addQuery("name", this.CONSTANTS.TRACKER_NAME);
		trackerGr.addQuery("state", "IN", "0,1"); //Pending or Running
		trackerGr.query();
		if (trackerGr.next())
			return trackerGr.getUniqueValue();
		return "";
	},

	createWorker: function(gr, userId, deleteCIs) {
		if (!deleteCIs)
			deleteCIs = false;

		if (!gr)
			return;

		var trackerId = this._getRunningWorker(gr.getUniqueValue());
		if (trackerId) {
			var execTracker = SNC.GlideExecutionTracker.getBySysID(trackerId);
			execTracker.cancel(gs.getMessage("Unpacking dynamic CIs has been cancelled"));
		}

		var worker = new GlideScriptedHierarchicalWorker();
		worker.setProgressName(this.CONSTANTS.TRACKER_NAME);
		worker.setScriptIncludeName(this.CONSTANTS.TRACKER_SCRIPT);

		if (deleteCIs) {
			worker.setScriptIncludeMethod("deleteUnpackedCIs");
			worker.putMethodArg("taskId", gr.task + '');
			worker.putMethodArg("groupId", gr.ci_item + '');
			worker.putMethodArg("recordId", gr.getUniqueValue() + '');
		}else {
			worker.setScriptIncludeMethod("unpackDynamicGroup");
			worker.putMethodArg("recordId", gr.getUniqueValue() + '');
		}
		worker.putMethodArg("userId", userId);
		worker.setBackground(true);
		worker.setSource(gr.getUniqueValue());
		worker.setSourceTable('task_ci');
		worker.setMaxProgressValue(4);	
		worker.start();

		return worker.getProgressID();
	},

	notifyUser: function(taskId, userId, message, title) {
		
		if (!userId || userId === "system")
			return;

		var taskGr = new GlideRecord('task');
		if (!taskGr.get(taskId))
			return;

		var taskType = taskGr.getRecordClassName();

		if (!new sn_oe_sfs.SidebarAccessCheckUtils().hasAccessToCreateSidebar(taskType, taskId))
			return;

		if (gs.getProperty("com.snc." + taskType + ".refresh_impacted_notify_user", 'true') + '' === 'true') {
			//Check if Polaris is disabled
			if (gs.getProperty(this.PROPERTIES.POLARIS_EXPERIENCE) !== "true") {
				if (typeof sn_connect === "undefined")
					return;
				var conversation = sn_connect.Conversation.create({name: taskGr.getDisplayValue('number'), type: "connect"});
				conversation.addSubscriber(userId);
				conversation.sendMessage({body: message,  field: "system"});
			} else {
				if (typeof sn_collab === "undefined")
					return;
				var userList = [];
				userList.push(userId);
				sn_collab.CollabChatScriptObject.createChat(taskType, taskId, title, message, userList, true, "", []);
			}
		}
	},

	triggerRefreshImpactedServices: function(record, hideMessage) {
		if (!record) {
			if (this.refreshLog.atLevel(GSLog.DEBUG))
				this.refreshLog.debug("[triggerRefreshImpactedServices] No record has been supplied for refreshing impacted services");
			return;
		}

		var taskType = record.getRecordClassName();

		if (this.refreshLog.atLevel(GSLog.DEBUG))
			this.refreshLog.debug("[triggerRefreshImpactedServices] Refresh is triggered on " + taskType + " with sysid: " + record.getUniqueValue());

		if (taskType === 'change_request') {
			var chgUtils = new ChangeUtils();
			var eventProp = gs.getProperty(chgUtils.PROP_RUN_REFRESH_AS_EVENT) + "" === "true";
			chgUtils.refreshImpactedServices(record, eventProp);
		} else {
			var refreshImpactedServicesMsg = gs.getMessage("Refresh impacted services has been initiated");
			var COM_SNC_TASK_TYPE = "com.snc." + taskType;

			if (this.refreshLog.atLevel(GSLog.DEBUG))
				this.refreshLog.debug("[triggerRefreshImpactedServices] Event: " + COM_SNC_TASK_TYPE + this.PROPERTIES.RUN_REFRESH_AS_EVENT + " with value: " + gs.getProperty(COM_SNC_TASK_TYPE + this.PROPERTIES.RUN_REFRESH_AS_EVENT));

			if (gs.getProperty(COM_SNC_TASK_TYPE + this.PROPERTIES.RUN_REFRESH_AS_EVENT) + "" === "true") {
				gs.eventQueue(taskType + ".refresh_impacted_ci", record, gs.getUserID());

				hideMessage = !!hideMessage;
				var showMessageProperty = COM_SNC_TASK_TYPE + this.PROPERTIES.REFRESH_IMPACTED_SERVICES_MESSAGE_SHOW;
				var showMessagePropertyValue = gs.getProperty(showMessageProperty, "true") === "true";

				if (this.refreshLog.atLevel(GSLog.DEBUG))
					this.refreshLog.debug("[triggerRefreshImpactedServices] hideMessage: " + hideMessage + " " + showMessageProperty + ": " + showMessagePropertyValue);

				if (!hideMessage && showMessagePropertyValue)
					gs.addInfoMessage(refreshImpactedServicesMsg);

			} else
				this.refreshImpactedServices(record.getUniqueValue(), null);
		}
	},

	refreshImpactedServices: function(recordId, userId) {
		if (!recordId) {
			if (this.refreshLog.atLevel(GSLog.DEBUG))
				this.refreshLog.debug("[refreshImpactedServices] No recordId has been supplied for refreshing impacted services");
			return;
		}
		var tsk = new GlideRecord('task');
		if (!tsk.get(recordId)) {
			if (this.refreshLog.atLevel(GSLog.DEBUG))
				this.refreshLog.debug("[refreshImpactedServices] No task can be found for ID:" + recordId);
			return;
		}
		var taskType = tsk.getRecordClassName();
		var ciUtil = new CIUtils();
		if (this.refreshLog.atLevel(GSLog.DEBUG))
			this.refreshLog.debug("[refreshImpactedServices] com.snc." + taskType + ".refresh_impacted.include_affected_cis :" + gs.getProperty("com.snc." + taskType + ".refresh_impacted.include_affected_cis"));
		if (gs.getProperty("com.snc." + taskType + ".refresh_impacted.include_affected_cis") + '' === 'true')
			ciUtil.refreshImpactedServicesFromAffectedCIs(tsk);
		else
			ciUtil.refreshImpactedServices(tsk);
		this.refreshRelatedLists(tsk);
		if (userId) {
			var msg = gs.getMessage("Refresh impacted services for {0} has completed", tsk.getDisplayValue('number'));
			var title = gs.getMessage("Refresh impacted services");
			this.notifyUser(recordId, userId, msg, title);
		}
	},
	
	activateVirtualAgentContactType: function(tableName, skipInsert) {
		var gr = new GlideRecord('sys_choice');
		gr.addQuery('name', tableName);
		gr.addQuery('element', 'contact_type');
		gr.addQuery('value', 'virtual_agent');
		gr.query();
		if (!gr.next() && !skipInsert) {
			gs.log('No virtual_agent choice found for ' + tableName + '.contact_type - dynamically creating one');
			var newChoice = new GlideRecord('sys_choice');
			newChoice.initialize();
			newChoice.setValue('name', tableName);
			newChoice.setValue('element', 'contact_type');
			newChoice.setValue('value', 'virtual_agent');
			newChoice.setValue('label', 'Virtual Agent');
			newChoice.setValue('inactive', 'false');
			newChoice.insert();
		} else {
			gr.setValue('inactive', false);
			gr.update();
		}
		gs.log(tableName + '.contact_type choice activated for virtual agent');
	},

	_insertTaskCIFromDynamicGroup: function(cmdb, taskId) {
		if (!cmdb.filter || !cmdb.table)
			return;

		var currentSysId = cmdb.getUniqueValue();
		var configItemAssocGr = new GlideRecord(cmdb.table);
		configItemAssocGr.addEncodedQuery(cmdb.filter);
		configItemAssocGr.query();

		var currentCIs = this._getRecordsJSON(taskId, this.TABLE.TASK_CI);
		var m2m = new GlideRecord(this.TABLE.TASK_CI);
		while (configItemAssocGr.next()) {
			var ci_id = configItemAssocGr.getUniqueValue();
			if (ci_id !== currentSysId) {
				var taskCi = '';
				if (!currentCIs.hasOwnProperty(ci_id)) {
					m2m.initialize();
					m2m.task = taskId;
					m2m.ci_item = ci_id;
					m2m.added_from_dynamic_ci = currentSysId;
					taskCi = m2m.insert();
					if (!taskCi) {
						//The CI has already been inserted so requery to find the record
						var tskCiGr = new GlideRecord(this.TABLE.TASK_CI);
						tskCiGr.addQuery('task', taskId);
						tskCiGr.addQuery('ci_item', ci_id);
						tskCiGr.query();
						if (tskCiGr.next())
							taskCi = tskCiGr.getUniqueValue();
					}
				} else
					taskCi = currentCIs[parsedID];

				this._createCIGroupAssoc(taskCi, currentSysId);
			}
		}
	},

	type: 'TaskUtilsSNC'
};