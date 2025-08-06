
export interface WhatsAppNotificationInput {
    phone_number: string;
    message: string;
    type: 'NEW_REQUEST' | 'STATUS_UPDATE';
}

export async function sendWhatsAppNotification(input: WhatsAppNotificationInput): Promise<boolean> {
    try {
        // Log notification attempt for debugging
        console.log(`Attempting to send WhatsApp notification:`, {
            phone: input.phone_number,
            type: input.type,
            messageLength: input.message.length
        });

        // Validate phone number format (basic validation)
        if (!input.phone_number || input.phone_number.trim().length === 0) {
            console.error('Invalid phone number provided');
            return false;
        }

        // Validate message content
        if (!input.message || input.message.trim().length === 0) {
            console.error('Empty message content provided');
            return false;
        }

        // Format phone number (ensure it starts with country code)
        const formattedPhone = formatPhoneNumber(input.phone_number);
        
        // Simulate WhatsApp API call with retry mechanism
        const maxRetries = 3;
        let attempts = 0;
        
        while (attempts < maxRetries) {
            attempts++;
            
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Simulate API response based on message type
                const success = await simulateWhatsAppAPI(formattedPhone, input.message, input.type);
                
                if (success) {
                    console.log(`WhatsApp notification sent successfully on attempt ${attempts}:`, {
                        phone: formattedPhone,
                        type: input.type
                    });
                    return true;
                } else if (attempts === maxRetries) {
                    console.error(`WhatsApp notification failed after ${maxRetries} attempts:`, {
                        phone: formattedPhone,
                        type: input.type
                    });
                    return false;
                }
            } catch (error) {
                console.error(`WhatsApp notification attempt ${attempts} failed:`, error);
                
                if (attempts === maxRetries) {
                    return false;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
        }
        
        return false;
    } catch (error) {
        console.error('WhatsApp notification failed:', error);
        return false;
    }
}

function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume it's Indian number (+91)
    if (!digits.startsWith('91') && digits.length === 10) {
        return `91${digits}`;
    }
    
    return digits;
}

async function simulateWhatsAppAPI(phone: string, message: string, type: string): Promise<boolean> {
    // Simulate different success rates based on message type
    const successRate = type === 'NEW_REQUEST' ? 0.9 : 0.85;
    
    // Simulate network issues for certain phone patterns (for testing)
    if (phone.endsWith('0000')) {
        throw new Error('Network timeout');
    }
    
    // Simulate API failure for testing
    if (phone.endsWith('9999')) {
        return false;
    }
    
    return Math.random() < successRate;
}
