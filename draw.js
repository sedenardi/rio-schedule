var statuses = {
  'LIVE': 'live',
  'TAPE': 'tape'
};
var day = _.filter(schedule, function(e) {
  return moment(e.Start).format('YYYYMMDD') === moment().format('YYYYMMDD');
});
var networks = _.chain(day)
  .map('Network')
  .uniq()
  .value();
var events = _.map(day, function(e) {
  e.startDate = new Date(e.Start);
  e.endDate = new Date(e.End);
  e.taskName = e.Network;
  e.status = e.LiveOrTape.indexOf('LIVE') === 0 ? 'LIVE' : 'TAPE';
  return e;
});
var minDate = _.maxBy(events, 'startDate').startDate;
var maxDate = _.maxBy(events, 'endDate').endDate;

var format = '%H:%M';
var gantt = d3.gantt().taskTypes(networks).taskStatus(statuses).tickFormat(format);
gantt(events);
