const fs = require('fs');
const tsNode = require('ts-node');
tsNode.register();
const { getDepartmentInfo } = require('./src/utils/departmentDetector.ts');

const testCases = [
  { name: 'GHS ALLAI', office: 'DEO (E&SE) BATTAGRAM' },
  { name: 'Govt Degree College', office: 'Higher Education Department' },
  { name: 'DHQ Hospital', office: 'Health Department' },
  { name: 'Police Station City', office: 'Police Department' },
  { name: 'Assistant Commissioner Office', office: 'Revenue Department' },
];

const results = testCases.map(tc => {
  const info = getDepartmentInfo(tc.name, tc.office, 'Allai', 'Battagram');
  return {
    input: tc,
    detectedDept: info.departmentShort,
    authority: info.authorityTitle
  };
});

console.log(JSON.stringify(results, null, 2));
