import {sendEmailBySES} from './utils/sesHelper'
import {ddbPutCommandHelper} from './utils/ddbHelpers'
const TABLE_NAME = process.env.TABLE_NAME as string;
const apiBaseUrl = process.env.API_URL as string;
export const sendEmailToApproverHandler = async (event:any) => {
  console.log(event)
  try {
    const { userEmail, startDate, endDate, leaveType, approverEmail, taskToken } = event;
    const reason = event.reason || 'Reason not mentioned';
    if (!leaveType || !startDate || !endDate || !approverEmail || !userEmail) {
      return { 
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing parameters in the Event"
        })
      };
    }
    const leaveID = `ID-${Date.now()}`;
    const item = {
      leaveID,
      userEmail,
      approverEmail,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending"
    }
    try{
      const res = await ddbPutCommandHelper(
          TABLE_NAME,
          item);
      } catch(error) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Failed to save in database"
          }),
        }
      }
    // we send these two links to invoke another process approval lambda
    const approvalLink = `https://${apiBaseUrl}.execute-api.us-east-1.amazonaws.com/Prod/process-approval?leaveID=${leaveID}&status=Approved&taskToken=${encodeURIComponent(taskToken)}`;
    const rejectionLink = `https://${apiBaseUrl}.execute-api.us-east-1.amazonaws.com/Prod/process-approval?leaveID=${leaveID}&status=Rejected&taskToken=${encodeURIComponent(taskToken)}`;
    const emailParams = {
      Destination: { ToAddresses: [approverEmail] },
      Message: {
        Body: {
          Html: {
            Data :`
            <h4>Leave Approval Request from ${userEmail}</h3>
            <h5>Details of leave request ${leaveID}</h5>
            <p>Leave Type - ${leaveType}</p>
            <p>Start Date - ${startDate}</p>
            <p>End Date - ${endDate}</p>
            <p>Reason for the leave is ${reason}</p>
            <p>Click any one of the below approve or reject the leave Request.</p>
            <a href=${approvalLink} target="_blank" style=
              "background-color: #2f855a;
              color: white;
              padding: 14px 25px;
              text-align: center;
              text-decoration: none;
              display: inline-block;">Approve</a>
            <a href=${rejectionLink} target="_blank" style=
              "background-color: #742a2a;
                color: white;
                padding: 14px 25px;
                text-align: center;
                text-decoration: none;
                display: inline-block;">Reject</a>
            `
          }
        },
        Subject: { Data: `Leave Request ${leaveID} has been sent from the ${userEmail}` },
      },
      Source: "jangamchenchugokul@gmail.com"
    };
    // sends the mail to approver
    await sendEmailBySES(emailParams);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message sent to Approver"
      }),
    };
  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to send email"
      }),
    };
  }
};
