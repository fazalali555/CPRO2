
import React from "react";
import { EmployeeRecord } from "../../types";

interface Props {
  employee: EmployeeRecord;
}

export const DCSOptionForm: React.FC<Props> = ({ employee }) => {
  const emp = employee.employees;
  const ben = employee.extras?.beneficiary || {};
  const currentYear = new Date().getFullYear();

  // Helper to ensure we don't display 'undefined'
  const val = (v: string | undefined | null) => v || "--------------------";

  return (
    <div className="dcs-wrapper font-times">
      <div className="page">
        {/* TITLE */}
        <div className="titleBlock">
          <div className="title1">
            OPTION FORM, FOR DIRECT CREDIT PENSION THROUGH BANK ACCOUNT
          </div>
          <div className="title2">
            Pensioner Information (To be filled by the Pensioner)
          </div>
        </div>

        {/* TOP TABLE */}
        <table className="tbl tblTop" aria-label="Pensioner Information">
          <colgroup>
            <col style={{ width: "52px" }} />
            <col style={{ width: "55%" }} />
            <col style={{ width: "45%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="center bold">S.No</td>
              <td className="bold">P.P.O. No:</td>
              <td className="bold">{val(emp.ppo_no)}</td>
            </tr>

            <tr>
              <td className="center">1</td>
              <td className="bold">SAP PERSONNEL NO:</td>
              <td className="bold">{val(emp.personal_no)}</td>
            </tr>

            <tr>
              <td className="center">2</td>
              <td className="bold">
                ACCOUNTS OFFICE:
                <br />
                (FROM WHERE PPO ORIGINALLY ISSUED)
              </td>
              <td className="bold uppercase">
                District&nbsp;&nbsp;Accounts&nbsp;&nbsp;Office&nbsp;&nbsp;{val(emp.district)}
              </td>
            </tr>

            <tr>
              <td className="center">3</td>
              <td className="bold">NAME OF PENSIONER (Deceased):</td>
              <td className="bold uppercase">{val(emp.name)}</td>
            </tr>

            <tr>
              <td className="center">4</td>
              <td className="bold">FATHER/HUSBAND NAME:</td>
              <td className="bold uppercase">{val(emp.father_name)}</td>
            </tr>

            <tr>
              <td className="center">5</td>
              <td className="bold">FAMILY PENSIONER NAME:</td>
              <td className="bold uppercase">{val(ben.name)}</td>
            </tr>

            <tr>
              <td className="center">6</td>
              <td className="bold">SPOUSE/FATHER/MOTHER NAME:</td>
              <td className="bold uppercase">{val(emp.name)}</td>
            </tr>

            <tr>
              <td className="center">7</td>
              <td className="bold">PENSIONER NIC No: (OLD)</td>
              <td>--------------------</td>
            </tr>

            <tr>
              <td className="center">8</td>
              <td className="bold">PENSIONER CNIC No:</td>
              <td className="bold">{val(emp.cnic_no)}</td>
            </tr>

            <tr>
              <td className="center">9</td>
              <td className="bold">FAMILY PENSIONER CNIC No:</td>
              <td className="bold">{val(ben.cnic)}</td>
            </tr>

            <tr>
              <td className="center">10</td>
              <td className="bold">RESIDENTIAL ADDRESS: (CURRENT)</td>
              <td className="bold uppercase">
                {val(emp.address)}
              </td>
            </tr>

            <tr>
              <td className="center">11</td>
              <td className="bold">RESIDENTIAL ADDRESS: (PERMANENT)</td>
              <td className="bold">As&nbsp;&nbsp;Above</td>
            </tr>

            <tr>
              <td className="center">12</td>
              <td className="bold">
                DESIGNITION &amp; GRADE
                <br />
                (AT THE TIME OF RETIREMENT)
              </td>
              <td className="bold uppercase">{emp.designation}&nbsp;&nbsp;BPS&nbsp;&nbsp;-&nbsp;&nbsp;{emp.bps}</td>
            </tr>

            <tr>
              <td className="center">13</td>
              <td className="bold">MINISTRY/DIVISION/DEPARTMENT</td>
              <td className="bold">Education</td>
            </tr>

            <tr>
              <td className="center">14</td>
              <td className="bold">PRESENT BANK ADDRESS AND CODE No.</td>
              <td className="bold uppercase">{val(ben.bank_name)} {val(ben.branch_name)}</td>
            </tr>

            <tr>
              <td className="center">15</td>
              <td className="bold">CONTACT No.</td>
              <td className="bold">{val(ben.contact || emp.mobile_no)}</td>
            </tr>

            <tr>
              <td className="center">16</td>
              <td className="bold">EMAIL ADDRESS (IF ANY)</td>
              <td>--------------------</td>
            </tr>

            {/* Row 17 (4 columns inside the last row) */}
            <tr>
              <td className="center">17</td>
              <td className="pad0" colSpan={2}>
                <table className="tbl innerTbl" aria-label="Bank Branch Name and Code">
                  <colgroup>
                    <col style={{ width: "27%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "23%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="bold">Bank Branch Name</td>
                      <td className="bold uppercase">{val(ben.branch_name)}</td>
                      <td className="bold">Branch Code:</td>
                      <td className="bold">{val(ben.branch_code)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* DECLARATION BOX */}
        <div className="box">
          <div className="boxTitle">
            I HEREBY OPT TO DRAW PENSION THROUGH DIRECT CREDIT SYSTEM AND HAVE ALSO
            SUBMITTED INDEMNITY BOND TO THE BANK....
          </div>

          <div className="boxBody">
            The Pensioner shall produce an Indemnity Bond to keep the indemnified about
            liabilities with all sums of money whatsoever including mark-up of his/her
            Pension Account. The Pensioner would further undertake that his/her legal
            heirs, successors, executors shall be liable to refund excess amount, if any,
            credited to his/her Pension Account either in full or in installments (as
            agreed manually) equal to such excess amount.
          </div>
        </div>

        {/* SIGNATURE / THUMB BOX */}
        <div className="sigBox">
          <div className="sigLeft">
            <div className="bold">PENSIONER&apos;S SIGNATURE</div>
            <div className="bold">(OR) THUMB IMPRESSION</div>
          </div>

          <div className="sigMid">
            <div className="thumbDashed" />
          </div>

          <div className="sigRight">
            <div className="bold">Dated :____/____/{currentYear}.</div>
          </div>
        </div>

        {/* BANK ACCOUNT VERIFICATION TITLE */}
        <div className="bankTitle">
          <span className="underline">
            BANK ACCOUNT VERIFICATION (To be verified by the Bank)
          </span>
        </div>

        {/* BANK VERIFICATION TABLE + MANAGER STAMP CELL */}
        <table className="tbl bankTbl" aria-label="Bank Account Verification">
          <colgroup>
            <col style={{ width: "52px" }} />
            <col style={{ width: "44%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "26%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="center">1</td>
              <td className="bold">ACCOUNT TITLE (NAME)</td>
              <td className="bold uppercase">{val(ben.name)}</td>
              <td className="managerCell" rowSpan={6}>
                <div className="managerLine" />
                <div className="managerText">
                  SIGNATURE &amp; STAMP OF
                  <br />
                  BANK MANAGER
                </div>
              </td>
            </tr>

            <tr>
              <td className="center">2</td>
              <td className="bold">ACCOUNT NUMBER</td>
              <td className="bold font-mono tracking-wider">{val(ben.account_no)}</td>
            </tr>

            <tr>
              <td className="center">3</td>
              <td className="bold">BANK NAME:</td>
              <td className="bold uppercase">{val(ben.bank_name)}</td>
            </tr>

            <tr>
              <td className="center">4</td>
              <td className="bold">BRANCH ADDRESS:</td>
              <td className="bold uppercase">{val(ben.branch_name)}</td>
            </tr>

            <tr>
              <td className="center">5</td>
              <td className="bold">BRANCH CODE:</td>
              <td className="bold">{val(ben.branch_code)}</td>
            </tr>

            <tr>
              <td className="center">6</td>
              <td className="bold">
                INEMNITY BOND SUBMITTED BY THE
                <br />
                PENSIONER:
              </td>
              <td className="bold">
                Yes <span className="chk" /> &nbsp;&nbsp;&nbsp;&nbsp; No{" "}
                <span className="chk" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* TO BE ISSUED BY ACCOUNT OFFICE */}
        <div className="issuedTitle">
          <span className="underline bold">TO BE ISSUED BY ACCOUNT OFFICE</span>
        </div>

        {/* ACK RECEIPT LINE */}
        <div className="ackRow">
          <div className="ackLeft">
            Acknowledgment Receipt No&nbsp;______________
          </div>
          <div className="ackRight">
            Acknowledgment Receipt Date____/____/{currentYear}.
          </div>
        </div>

        {/* NOTE */}
        <div className="noteRow">
          <div className="noteLabel">Note:</div>
          <div className="noteText">
            Original Option Form, Photocopies of indemnity Bond + C.N.I.C and Original
            both halves of Pension Payment Order (PPO) Received.
          </div>
        </div>

        {/* DETAILS OF RECEIVED OFFICER */}
        <div className="detailsTitle underline bold">DETAILS OF RECEIVED OFFICER</div>

        <div className="receivedBlock">
          <div className="receivedRow">
            <div className="receivedLabel bold">Name:</div>
            <div className="dots" />
          </div>
          <div className="receivedRow">
            <div className="receivedLabel bold">Designation:</div>
            <div className="dots" />
          </div>
        </div>
      </div>

      <style>{`
        /* Scoped to .dcs-wrapper to prevent global bleed */
        .dcs-wrapper * { box-sizing: border-box; }
        .dcs-wrapper .font-times {
          font-family: "Times New Roman", Times, serif;
          font-kerning: normal;
          font-variant-ligatures: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .dcs-wrapper .page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          color: #000;
          padding: 9mm 8mm;
          font-size: 11px;
          line-height: 1.2;
          margin: 0 auto;
        }

        .titleBlock{ text-align:center; margin-bottom:4px; }
        .title1{ font-weight:700; letter-spacing:.2px; }
        .title2{ margin-top:1px; font-weight:700; }

        .tbl{ width:100%; border-collapse:collapse; table-layout:fixed; }
        .tblTop{ margin-top:4px; }
        .tbl td, .tbl th{
          border:1px solid #000;
          padding:3px 5px;
          vertical-align:top;
        }

        .center{ text-align:center; }
        .bold{ font-weight:700; }
        .pad0{ padding:0 !important; }

        .innerTbl td{ border:1px solid #000; padding:3px 5px; }

        .box{ margin-top:8px; border:2px solid #000; }
        .boxTitle{
          font-weight:700;
          padding:5px 7px;
          border-bottom:2px solid #000;
          letter-spacing:.2px;
        }
        .boxBody{
          padding:8px 9px;
          font-size:10.5px;
          line-height:1.25;
        }

        .sigBox{
          margin-top:8px;
          border:2px solid #000;
          display:flex;
          align-items:stretch;
          height:60px;
        }
        .sigLeft{
          width:34%;
          padding:8px 8px;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
          gap:5px;
        }
        .sigMid{
          width:36%;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:6px 0;
        }
        .thumbDashed{
          width:170px;
          height:46px;
          border:3px dashed #000;
        }
        .sigRight{
          width:30%;
          display:flex;
          align-items:flex-end;
          justify-content:flex-end;
          padding:8px 12px;
          font-size:11px;
        }

        .bankTitle{ margin-top:8px; text-align:center; font-weight:700; }
        .underline{ text-decoration: underline; text-underline-offset: 2px; }

        .bankTbl{ margin-top:4px; }
        .managerCell{
          text-align:center;
          vertical-align:middle;
          padding:6px 8px;
        }
        .managerLine{
          width:100%;
          border-top:3px dotted #000;
          margin:8px 0 12px 0;
        }
        .managerText{ font-weight:700; letter-spacing:.2px; }

        .chk{
          display:inline-block;
          width:16px;
          height:12px;
          border:2px dashed #000;
          vertical-align:middle;
          margin-left:4px;
        }

        .issuedTitle{ margin-top:6px; text-align:center; font-size:11px; }

        .ackRow{
          margin-top:6px;
          display:flex;
          justify-content:space-between;
          font-size:10.5px;
          padding:0 2px;
        }

        .noteRow{ margin-top:8px; display:flex; gap:8px; font-size:10.5px; }
        .noteLabel{ width:42px; font-weight:700; }
        .noteText{ flex:1; }

        .detailsTitle{ margin-top:10px; font-size:11px; }

        .receivedBlock{
          margin-top:16px;
          display:flex;
          flex-direction:column;
          gap:16px;
          align-items:flex-end;
          padding-right:14px;
        }
        .receivedRow{
          width:55%;
          display:flex;
          align-items:center;
          gap:8px;
        }
        .receivedLabel{ width:90px; text-align:left; }
        .dots{ flex:1; border-bottom:3px dotted #000; height:0; }

        @media print{
          .dcs-wrapper { width: 100%; }
          .page { box-shadow:none; margin: 0; }
        }
      `}</style>
    </div>
  );
};
