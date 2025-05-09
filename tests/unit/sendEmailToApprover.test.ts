import {mockClient} from 'aws-sdk-client-mock';
import {sendEmailToApproverHandler} from '../../lambdas/sendEmailToApprover'
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {APIGatewayProxyEvent} from 'aws-lambda'
import {DynamoDBDocumentClient, PutCommand} from '@aws-sdk/lib-dynamodb'
process.env.TABLE_NAME = 'myTable';
const ddbMock = mockClient(DynamoDBDocumentClient);
const sesMock = mockClient(SESClient);

const event:APIGatewayProxyEvent  = {
    body: '',
    headers: {},
    multiValueHeaders: {},
    httpMethod: '',
    isBase64Encoded: false,
    path: '',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
        accountId: '',
        apiId: '',
        authorizer: undefined,
        protocol: '',
        httpMethod: '',
        identity: {
            accessKey: null,
            accountId: null,
            apiKey: null,
            apiKeyId: null,
            caller: null,
            clientCert: null,
            cognitoAuthenticationProvider: null,
            cognitoAuthenticationType: null,
            cognitoIdentityId: null,
            cognitoIdentityPoolId: null,
            principalOrgId: null,
            sourceIp: '',
            user: null,
            userAgent: null,
            userArn: null
        },
        path: '',
        stage: '',
        requestId: '',
        requestTimeEpoch: 0,
        resourceId: '',
        resourcePath: ''
    },
    resource: ''
}
describe('unit test for app handler', function() {
    beforeEach(() => {
        sesMock.reset();
    })
    test('fail case for missing params', async() => {
        const taskToken = "";
        const result = await sendEmailToApproverHandler(event, taskToken);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toEqual('Missing parameters in the Event')
    })
    test('It will send email successfully', async() => {
        event.body = JSON.stringify({
            employeeEmail: 'example@abc.com',
            approverEmail: 'example@abc.com',
            leaveType: 'vacation',
            startDate: '10-10-10',
            endDate: '10-10-10'
        })
        sesMock.on(SendEmailCommand).resolves({})
        ddbMock.on(PutCommand).resolves({})
        const taskToken = "";
        const result = await sendEmailToApproverHandler(event, taskToken);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toEqual("Message sent to Approver");
    })
    test('It will fail because of internal server error', async() => {
        
        const taskToken = "jhdgb"
        sesMock.on(SendEmailCommand).rejects(new Error('some error while sending email'))
        const result = await sendEmailToApproverHandler(event, taskToken);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toEqual("Failed to send email");
    })
    test('It will fail because of internal server error', async() => {
        
        const taskToken = "jhdgb"
        ddbMock.on(PutCommand).rejects(new Error('some error while adding to DB'))
        const result = await sendEmailToApproverHandler(event, taskToken);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toEqual("Failed to save in database");
    })
});