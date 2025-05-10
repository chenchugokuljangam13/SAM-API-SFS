import {mockClient} from 'aws-sdk-client-mock';
import {sendEmailToApproverHandler} from '../../lambdas/sendEmailToApprover'
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {DynamoDBDocumentClient, PutCommand} from '@aws-sdk/lib-dynamodb'
process.env.TABLE_NAME = 'myTable';
const ddbMock = mockClient(DynamoDBDocumentClient);
const sesMock = mockClient(SESClient);

const event: Record<string, string>  = {}
describe('unit test for app handler', function() {
    beforeEach(() => {
        sesMock.reset();
    })
    test('fail case for missing params', async() => {
        const result = await sendEmailToApproverHandler(event);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toEqual('Missing parameters in the Event')
    })
    test('It will send email successfully', async() => {
        const event1 = {
            userEmail: 'example@abc.com',
            approverEmail: 'example@abc.com',
            leaveType: 'vacation',
            startDate: '10-10-10',
            endDate: '10-10-10',
            taskToken: 'fgh'
        }
        sesMock.on(SendEmailCommand).resolves({})
        ddbMock.on(PutCommand).resolves({})
        const result = await sendEmailToApproverHandler(event1);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toEqual("Message sent to Approver");
    })
    test('It will fail because of internal server error', async() => {
        const event1 = {
            userEmail: 'example@abc.com',
            approverEmail: 'example@abc.com',
            leaveType: 'vacation',
            startDate: '10-10-10',
            endDate: '10-10-10',
            taskToken: 'fgh'
        }
        sesMock.on(SendEmailCommand).rejects(new Error('some error while sending email'))
        const result = await sendEmailToApproverHandler(event1);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toEqual("Failed to send email");
    })
    test('It will fail because of internal server error', async() => {
        const event1 = {
            userEmail: 'example@abc.com',
            approverEmail: 'example@abc.com',
            leaveType: 'vacation',
            startDate: '10-10-10',
            endDate: '10-10-10',
            taskToken: 'fgh'
        }
        ddbMock.on(PutCommand).rejects(new Error('some error while adding to DB'))
        const result = await sendEmailToApproverHandler(event1);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toEqual("Failed to save in database");
    })
});