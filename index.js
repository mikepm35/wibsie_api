'use strict';

const CitySDK = require('citysdk');

let sdk = new CitySDK();
sdk.modules.census = new modules.CensusModule();
sdk.modules.census.APIRequest = sdk.modules.census.APIRequest.bind(sdk.modules.census);
let isCensusEnabled = sdk.modules.census.enable('f8d4594272560d4a4e790b882162a62508ffff61')

const request = {
		level: "state",
		state: "CA",
		variables: [
				"income",
				"population",
				"median_male_age"
		]
};
if (isCensusEnabled) {
	console.log('Census Enabled, Requesting Data');
	sdk.modules.census.APIRequest(request, function (response) {
		console.log(response);
	});
}
