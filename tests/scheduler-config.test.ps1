$ErrorActionPreference = 'Stop'
$global:schedulerFixtureMutations = @()
$global:schedulerFixtureJobs = @(
  [pscustomobject]@{ name = 'projects/homescope-ee781/locations/test-region/jobs/main'; state = 'ENABLED'; schedule = '0 * * * *'; timeZone = 'UTC'; httpTarget = @{ uri = 'https://homescopegta.ca/api/internal/mls-sync/scheduled'; headers = @{ secret = 'never-print-header' } } },
  [pscustomobject]@{ name = 'projects/homescope-ee781/locations/test-region/jobs/duplicate'; state = 'ENABLED'; schedule = '*/15 * * * *'; timeZone = 'UTC'; httpTarget = @{ uri = 'https://homescopegta.ca/api/internal/mls-sync/scheduled' } },
  [pscustomobject]@{ name = 'projects/homescope-ee781/locations/test-region/jobs/alerts'; state = 'ENABLED'; schedule = '15 * * * *'; timeZone = 'UTC'; httpTarget = @{ uri = 'https://homescopegta.ca/api/internal/saved-search-alerts/daily?token=never-print-query' } },
  [pscustomobject]@{ name = 'projects/homescope-ee781/locations/test-region/jobs/pubsub'; state = 'ENABLED'; schedule = '* * * * *'; timeZone = 'UTC'; pubsubTarget = @{ topicName = 'unrelated' } }
)
function Get-Command {
  param($Name)
  if ($Name -ne 'gcloud') { throw 'Unexpected command' }
  [pscustomobject]@{ Source = { $global:LASTEXITCODE = 0; 'never-print-access-token' } }
}
function Invoke-RestMethod {
  param($Uri, $Headers, $Method, $ContentType, $Body)
  if ($Headers.Authorization -ne 'Bearer never-print-access-token') { throw 'Missing fixture auth' }
  if ($Uri -like '*/locations') { return @{ locations = @(@{ name = 'projects/homescope-ee781/locations/test-region' }) } }
  if ($Uri -like '*/jobs?pageSize=500') { return @{ jobs = $global:schedulerFixtureJobs } }
  $global:schedulerFixtureMutations += @{ Uri = $Uri; Method = $Method; Body = $Body }
  if ($Uri -like '*/duplicate:pause') { $global:schedulerFixtureJobs[1].state = 'PAUSED'; return @{} }
  if ($Method -eq 'Patch' -and $Uri -like '*/main?updateMask=*') {
    $patch = $Body | ConvertFrom-Json
    $global:schedulerFixtureJobs[0].schedule = $patch.schedule
    $global:schedulerFixtureJobs[0].timeZone = $patch.timeZone
    if ($patch.attemptDeadline -ne '900s' -or $patch.retryConfig.maxRetryDuration -ne '21600s' -or $patch.retryConfig.retryCount -ne 5 -or $patch.retryConfig.maxBackoffDuration -ne '300s') { throw 'Unexpected retry configuration' }
    if ($patch.httpTarget) { throw 'Must preserve authentication and target' }
    return @{}
  }
  throw "Unexpected fixture request: $Method $Uri"
}
$target = 'projects/homescope-ee781/locations/test-region/jobs/main'
$scriptPath = Join-Path $PSScriptRoot '../scripts/configure-mls-daily-schedule.ps1'
$preview = & $scriptPath -JobName $target
if ($global:schedulerFixtureMutations.Count -ne 0) { throw 'Preview mutated configuration' }
$applied = & $scriptPath -JobName $target -Apply
if ($global:schedulerFixtureMutations.Count -ne 2) { throw 'Expected duplicate pause and primary patch only' }
if ($global:schedulerFixtureJobs[2].state -ne 'ENABLED' -or $global:schedulerFixtureJobs[2].schedule -ne '15 * * * *' -or $global:schedulerFixtureJobs[3].state -ne 'ENABLED') {
  throw 'Unrelated jobs changed'
}
if (($preview + $applied | Out-String) -match 'never-print-') { throw 'Credential leaked into output' }
'PASS: scheduler preview, exact-target duplicate pause, daily timezone update, bounded retries, unrelated jobs preserved, output redacted.'

