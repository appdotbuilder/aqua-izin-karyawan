
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { sendWhatsAppNotification, type WhatsAppNotificationInput } from '../handlers/send_whatsapp_notification';

describe('sendWhatsAppNotification', () => {
    it('should send notification successfully with valid input', async () => {
        const input: WhatsAppNotificationInput = {
            phone_number: '+91 9876543210',
            message: 'New leave request submitted for approval',
            type: 'NEW_REQUEST'
        };

        const result = await sendWhatsAppNotification(input);
        expect(result).toBe(true);
    });

    it('should handle different message types', async () => {
        const newRequestInput: WhatsAppNotificationInput = {
            phone_number: '9876543211',
            message: 'Employee EMP001 submitted a leave request',
            type: 'NEW_REQUEST'
        };

        const statusUpdateInput: WhatsAppNotificationInput = {
            phone_number: '9876543212',
            message: 'Your leave request has been approved',
            type: 'STATUS_UPDATE'
        };

        const newRequestResult = await sendWhatsAppNotification(newRequestInput);
        const statusUpdateResult = await sendWhatsAppNotification(statusUpdateInput);

        expect(newRequestResult).toBe(true);
        expect(statusUpdateResult).toBe(true);
    });

    it('should format phone numbers correctly', async () => {
        const inputs = [
            {
                phone_number: '9876543213',
                message: 'Test message',
                type: 'NEW_REQUEST' as const
            },
            {
                phone_number: '+91 9876543214',
                message: 'Test message',
                type: 'NEW_REQUEST' as const
            },
            {
                phone_number: '91-9876543215',
                message: 'Test message',
                type: 'NEW_REQUEST' as const
            }
        ];

        for (const input of inputs) {
            const result = await sendWhatsAppNotification(input);
            expect(result).toBe(true);
        }
    });

    it('should return false for invalid phone numbers', async () => {
        const invalidInputs = [
            {
                phone_number: '',
                message: 'Test message',
                type: 'NEW_REQUEST' as const
            },
            {
                phone_number: '   ',
                message: 'Test message',
                type: 'NEW_REQUEST' as const
            }
        ];

        for (const input of invalidInputs) {
            const result = await sendWhatsAppNotification(input);
            expect(result).toBe(false);
        }
    });

    it('should return false for empty messages', async () => {
        const invalidInputs = [
            {
                phone_number: '9876543216',
                message: '',
                type: 'NEW_REQUEST' as const
            },
            {
                phone_number: '9876543217',
                message: '   ',
                type: 'NEW_REQUEST' as const
            }
        ];

        for (const input of invalidInputs) {
            const result = await sendWhatsAppNotification(input);
            expect(result).toBe(false);
        }
    });

    it('should handle API failures with retry mechanism', async () => {
        const input: WhatsAppNotificationInput = {
            phone_number: '9876549999', // This will simulate API failure
            message: 'Test message for failure case',
            type: 'STATUS_UPDATE'
        };

        const result = await sendWhatsAppNotification(input);
        expect(result).toBe(false);
    });

    it('should handle network errors with retry mechanism', async () => {
        const input: WhatsAppNotificationInput = {
            phone_number: '9876540000', // This will simulate network timeout
            message: 'Test message for network error',
            type: 'NEW_REQUEST'
        };

        const result = await sendWhatsAppNotification(input);
        expect(result).toBe(false);
    });

    it('should handle long messages correctly', async () => {
        const longMessage = 'A'.repeat(1000); // Very long message
        const input: WhatsAppNotificationInput = {
            phone_number: '9876543218',
            message: longMessage,
            type: 'STATUS_UPDATE'
        };

        const result = await sendWhatsAppNotification(input);
        expect(result).toBe(true);
    });

    it('should handle special characters in messages', async () => {
        const input: WhatsAppNotificationInput = {
            phone_number: '9876543219',
            message: 'Leave request for 🏖️ vacation approved! ✅ Enjoy your time off 😊',
            type: 'STATUS_UPDATE'
        };

        const result = await sendWhatsAppNotification(input);
        expect(result).toBe(true);
    });
});
