const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};


export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText)
    error.response = response;
    throw error;
  }
}

export function parseJSON(response) {
  return response.json();
}

export function uploadGeno(file, id) {
  var data = new FormData();
  data.append('file', file);
  return fetch(`/api/genotype/${id}`,
    {method: 'POST', body: data}
  ).then(checkStatus)
    .then(parseJSON);
}

export function startPrediction(id, trait) {
  return fetch(`/api/riskprediction/${id}/${trait}`,
    {method: 'POST'}
  ).then(checkStatus)
    .then(parseJSON);
}

export function transferGenotypeFromProvider(id, provider, genotypeId, accessToken) {
  return fetch(`/api/cloud/${provider}/genome/${genotypeId}/${id}`,
    {method: 'POST', headers: {'ACCESS-TOKEN': accessToken}}
  ).then(checkStatus)
    .then(parseJSON);
}

export function startImputation(id) {
  return fetch(`/api/imputation?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

export function startAncestry(id) {
  return fetch(`/api/ancestry?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

export function startRiskprediction(id) {
  return fetch(`/api/riskprediction?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

export function loadPcsData(platform,pc1,pc2) {
  return fetch(`/api/plotpcs?platform=${platform}&pc1=${pc1}&pc2=${pc2}`,{headers:headers})
    .then(checkStatus)
    .then(parseJSON);
}

export function loadImputationData(taskid) {
  return fetch(`/api/imputation?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

export function loadRiskData(taskid) {
  return fetch(`/api/riskprediction?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

export function loadAncestryData(taskid) {
  return fetch(`/api/ancestry?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

export function retrieveCloudGenotypes(provider, code) {
  return fetch(`/api/cloud/${provider}/token`, {method: 'POST', headers: {CODE: code}})
    .then(checkStatus)
    .then(parseJSON);
}

export function generateNewAnalysisId() {
  return fetch('/api/id/' , {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

export function loadAvailableProviders() {
  return fetch('/api/cloud', {headers: headers}).then(checkStatus).then(parseJSON);
}

export function loadAvailableTraits() {
  return fetch('/api/traits', {headers: headers}).then(checkStatus).then(parseJSON);
}

export function doCancelAnalysis(analysisType, taskids) {
  let promises = [];
  for (let taskid of taskids) {
    promises.push(fetch(`/api/${analysisType}/cancel/${taskid}`, {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON));
  }
  return Promise.all(promises);
}