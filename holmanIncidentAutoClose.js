autoCloseIncidents();

function autoCloseIncidents() {
    var incidentsClosed = [];
    var incidentsNotClosed = [];
    function closeIncidents(schedule, businessDayHours, country, callerOrIncLocation, incidentsClosed) {
        var closeCount = 0;
		var inc = new GlideRecord('incident');
		var query = 'state=' + IncidentState.RESOLVED + '^resolved_atISNOTEMPTY';

        // Filter out active major incidents, if MIM installed
        if (pm.isActive('com.snc.incident.mim')) {
			query += '^major_incident_state=^ORmajor_incident_state!=' + new sn_major_inc_mgmt.MajorIncidentTriggerRulesSNC().MAJOR_INCIDENT_STATE.ACCEPTED;
        }
        
		// Exclude OT Incident and its children
		if (pm.isActive('com.sn_ot_inc_mgmt')) {
			query += '^sys_class_nameNOT IN' + new TableUtils('sn_ot_incident').getAllExtensions().toArray().join();
		}

        // Add location-based filters to apply the correct schedule
        if (callerOrIncLocation == 'caller')
            query += '^caller_id.location.countryIN' + country.join(',');
        else if (callerOrIncLocation == 'inc') {
            var query1 = query + '^caller_id.location.country!=' + country.join('^caller_id.location.country!=') + 'OR^location.countryIN' + country.join(',');
            var query2 = query + '^caller_id.location.countryISEMPTY^location.countryIN' + country.join(',');
            query = query1 + '^NQ' + query2;
        }

        inc.addEncodedQuery(query);
        inc.query();
		while(inc.next()) {
			var dc = new DurationCalculator();
			dc.setSchedule(schedule);
			dc.setStartDateTime(inc.resolved_at);
			dc.calcDuration(days * businessDayHours * 60 * 60);
            var closeTime = dc.getEndDateTime();

            var now = new GlideDateTime();
            if (now.onOrAfter(closeTime)) {
                inc.incident_state = IncidentState.CLOSED;
                inc.state = IncidentState.CLOSED;
                // inc.comments = 'Incident automatically closed after ' + days + ' days in the Resolved state.';
                inc.active = false;
                inc.closed_by = inc.resolved_by;
                incidentsClosed.push(inc.getDisplayValue());
                closeCount++;
                inc.update();
			}
		}
	}

	//New function for the guest incident auto-close check 
	function closeGuestIncidents(schedule, businessDayHours, incidentsClosed) {

        var inc = new GlideRecord('incident');

        var query =
            'state=' + IncidentState.RESOLVED +
            '^resolved_atISNOTEMPTY' +
            '^affected_user.name=Guest';

        // Keep the same Major Incident exclusion
        if (pm.isActive('com.snc.incident.mim')) {
            query += '^major_incident_state=^ORmajor_incident_state!=' +
                new sn_major_inc_mgmt.MajorIncidentTriggerRulesSNC()
                    .MAJOR_INCIDENT_STATE.ACCEPTED;
        }

        // Keep the same OT Incident exclusion
        if (pm.isActive('com.sn_ot_inc_mgmt')) {
            query += '^sys_class_nameNOT IN' +
                new TableUtils('sn_ot_incident')
                    .getAllExtensions()
                    .toArray()
                    .join();
        }

        inc.addEncodedQuery(query);
        inc.query();

        while (inc.next()) {

            var dc = new DurationCalculator();

            // Guest incidents use Corporate IT schedule
            dc.setSchedule(schedule);

            dc.setStartDateTime(inc.resolved_at);

            // Same configured number of business days
            dc.calcDuration(days * businessDayHours * 60 * 60);

            var closeTime = dc.getEndDateTime();

            var now = new GlideDateTime();

            if (now.onOrAfter(closeTime)) {

                inc.incident_state = IncidentState.CLOSED;
                inc.state = IncidentState.CLOSED;

                // inc.comments = 'Incident automatically closed after ' +
                //     days + ' days in the Resolved state.';

                inc.active = false;
                inc.closed_by = inc.resolved_by;

                incidentsClosed.push(inc.getDisplayValue());

                inc.update();
            }
        }
    }

	var days = gs.getProperty('glide.ui.autoclose.time');
	days = parseInt(days);
    if (days > 0) {
        // Corporate IT Schedule (EST)
        closeIncidents('7ec22b7a3bc4e25023cebb9c24e45a80', 8.5, ['United States of America', 'India', 'Canada'], 'caller', incidentsClosed);
        closeIncidents('7ec22b7a3bc4e25023cebb9c24e45a80', 8.5, ['United States of America', 'India', 'Canada'], 'inc', incidentsClosed);
        // UK IT Schedule (GMT)
        closeIncidents('1ae42ffa3bc4e25023cebb9c24e45aa5', 9, ['United Kingdom', 'Germany'], 'caller', incidentsClosed);
        closeIncidents('1ae42ffa3bc4e25023cebb9c24e45aa5', 9, ['United Kingdom', 'Germany'], 'inc', incidentsClosed);
		closeGuestIncidents('7ec22b7a3bc4e25023cebb9c24e45a80', 8.5, incidentsClosed);
    }
}