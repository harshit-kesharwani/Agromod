import logging
import boto3
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_sns_client():
    region = getattr(settings, 'AWS_SNS_REGION', 'ap-south-1')
    return boto3.client('sns', region_name=region)


def format_e164(phone):
    """Ensure the phone number is in E.164 format for SNS."""
    cleaned = phone.strip().replace(' ', '').replace('-', '')
    if cleaned.startswith('+'):
        return cleaned
    if len(cleaned) == 10:
        return '+91' + cleaned
    if len(cleaned) == 12 and cleaned.startswith('91'):
        return '+' + cleaned
    return '+' + cleaned


def send_otp_sms(phone, otp):
    """Send OTP via AWS SNS. Returns True on success, False on failure."""
    e164_phone = format_e164(phone)
    message = f'Your Agromod verification code is {otp}. It expires in 10 minutes. Do not share this code.'

    try:
        client = _get_sns_client()
        response = client.publish(
            PhoneNumber=e164_phone,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional',
                },
            },
        )
        logger.info('OTP SMS sent to %s (MessageId: %s)', e164_phone, response.get('MessageId'))
        return True
    except ClientError:
        logger.exception('Failed to send OTP SMS to %s', e164_phone)
        return False
