from django.db import migrations


SCHEMES = [
    {
        'name': 'PM-KISAN Samman Nidhi',
        'slug': 'pm-kisan',
        'short_description': (
            'Under PM-KISAN, the government gives Rs 6,000 per year directly to '
            'small and marginal farmers in 3 installments of Rs 2,000 each.'
        ),
        'description': (
            'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a government scheme that gives '
            'Rs 6,000 per year to all landholding farmer families in India. The money is sent '
            'directly to the farmer\'s bank account in 3 equal installments of Rs 2,000 every '
            '4 months.\n\n'
            'This scheme was started in February 2019 to help small and marginal farmers meet '
            'their farming needs like buying seeds, fertilizers, and other inputs. Over 11 crore '
            'farmers across India have already benefited from this scheme.\n\n'
            'The money comes directly from the central government — there is no middleman. '
            'You just need to register once with your Aadhaar card and land papers.'
        ),
        'eligibility_criteria': (
            '• You must own farming land (cultivable land)\n'
            '• You must have an Aadhaar card\n'
            '• You must have a bank account linked to Aadhaar\n'
            '• No family member should be a government employee (current or retired with pension ≥ Rs 10,000/month)\n'
            '• No family member should be an income tax payer\n'
            '• You should not be a former or current MP, MLA, or minister\n'
            '• Available in all states and union territories of India'
        ),
        'documents_required': (
            '• Aadhaar card (mandatory)\n'
            '• Land ownership papers (khatauni / patta / ROR)\n'
            '• Bank account passbook (account must be linked to Aadhaar)\n'
            '• Recent passport-size photograph\n'
            '• Mobile number linked to Aadhaar'
        ),
        'application_process': (
            '1. Visit your nearest CSC center (Common Service Center) or go online to pmkisan.gov.in\n'
            '2. Click on "New Farmer Registration" and enter your Aadhaar number\n'
            '3. Fill in your personal details — name, address, state, district\n'
            '4. Enter your land details — survey number, area, khata number\n'
            '5. Enter your bank account number and IFSC code\n'
            '6. Upload your land documents\n'
            '7. Submit the form — you will get a registration number\n'
            '8. Your local Patwari or revenue officer will verify your land details\n'
            '9. Once verified, money will start coming to your bank account\n'
            '10. You can check your payment status on the PM-KISAN portal using your Aadhaar number'
        ),
        'official_link': 'https://pmkisan.gov.in/',
        'state': 'All India',
        'category': 'subsidy',
    },
    {
        'name': 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        'slug': 'pmfby',
        'short_description': (
            'PMFBY is a crop insurance scheme that protects farmers against crop loss due to '
            'natural calamities, pests, and diseases at a very low premium.'
        ),
        'description': (
            'Pradhan Mantri Fasal Bima Yojana (PMFBY) is the government\'s crop insurance scheme '
            'that protects farmers against crop failure due to natural disasters like floods, '
            'droughts, hailstorms, cyclones, and also pest or disease attacks.\n\n'
            'Farmers pay a very small premium:\n'
            '  • Kharif crops: just 2% of the insured amount\n'
            '  • Rabi crops: just 1.5% of the insured amount\n'
            '  • Commercial/Horticultural crops: 5% of the insured amount\n\n'
            'The remaining premium is paid by the central and state governments. If your crop is '
            'damaged, the insurance company will assess the damage and send the claim money directly '
            'to your bank account.\n\n'
            'Both landowners and tenant farmers (sharecroppers) can enroll. The scheme covers all '
            'food crops, oilseeds, and commercial/horticultural crops.'
        ),
        'eligibility_criteria': (
            '• Any farmer growing notified crops in notified areas can apply\n'
            '• Both landowners and tenant farmers / sharecroppers are eligible\n'
            '• You must have a bank account\n'
            '• Aadhaar card is mandatory\n'
            '• Land ownership papers (if you own land) or lease agreement (if tenant farmer)\n'
            '• Enrollment is voluntary for all farmers\n'
            '• You must enroll before the crop-sowing deadline for each season'
        ),
        'documents_required': (
            '• Aadhaar card\n'
            '• Bank account passbook\n'
            '• Land ownership documents (khatauni / patta) — for landowners\n'
            '• Lease agreement or letter from landowner — for tenant farmers\n'
            '• Sowing certificate from Patwari / revenue officer\n'
            '• Declaration about crops sown and area\n'
            '• Recent passport-size photograph'
        ),
        'application_process': (
            '1. Visit your nearest bank branch, CSC center, or insurance agent, or go online to pmfby.gov.in\n'
            '2. Fill the crop insurance application form\n'
            '3. Provide your Aadhaar number, bank details, and land information\n'
            '4. Specify the crop you are growing and the season\n'
            '5. Pay the premium amount (2% for Kharif, 1.5% for Rabi)\n'
            '6. You will receive a policy document with a reference number\n'
            '7. If your crop is damaged, report the loss within 72 hours by calling 14447 or using the PMFBY app\n'
            '8. An insurance surveyor will visit your field to assess the damage\n'
            '9. The claim amount will be sent to your bank account'
        ),
        'official_link': 'https://pmfby.gov.in/',
        'state': 'All India',
        'category': 'insurance',
    },
    {
        'name': 'Kisan Credit Card (KCC)',
        'slug': 'kcc',
        'short_description': (
            'KCC provides farmers with affordable credit (up to Rs 3 lakh at 4% interest) '
            'to buy seeds, fertilizers, and meet other farming expenses.'
        ),
        'description': (
            'Kisan Credit Card (KCC) is a credit scheme that gives farmers easy and affordable '
            'loans to meet their farming needs. With a KCC, you can get a loan of up to Rs 3 lakh '
            'at just 4% interest per year (after government subsidy on interest).\n\n'
            'You can use the KCC money to:\n'
            '  • Buy seeds, fertilizers, and pesticides\n'
            '  • Pay for farm labor and machinery rental\n'
            '  • Meet other crop production expenses\n'
            '  • Even meet personal/consumption needs\n\n'
            'The card works like a credit card — you can withdraw money when you need it and repay '
            'after harvest. The card is valid for 5 years and comes with free accident insurance '
            'cover of Rs 50,000.\n\n'
            'Farmers, fishermen, and animal husbandry farmers can all apply for KCC.'
        ),
        'eligibility_criteria': (
            '• You must be a farmer (own land or tenant/sharecropper)\n'
            '• Age: 18 to 75 years (co-borrower needed if above 60)\n'
            '• Must have a bank account\n'
            '• No overdue / unpaid loans at any bank\n'
            '• Valid ID proof (Aadhaar, Voter ID, PAN card, etc.)\n'
            '• Fishermen and animal husbandry farmers are also eligible\n'
            '• Available at all commercial banks, cooperative banks, and regional rural banks'
        ),
        'documents_required': (
            '• Aadhaar card or other valid ID proof\n'
            '• Land ownership documents (khatauni / patta) — for landowners\n'
            '• Lease agreement — for tenant farmers\n'
            '• Bank account passbook\n'
            '• 2 recent passport-size photographs\n'
            '• Filled KCC application form (available at bank)\n'
            '• No Dues certificate (if you had a previous loan)'
        ),
        'application_process': (
            '1. Visit your nearest bank branch — SBI, cooperative bank, or gramin bank\n'
            '2. Ask for the Kisan Credit Card application form\n'
            '3. Fill the form with your personal and land details\n'
            '4. Submit the form along with required documents\n'
            '5. The bank will verify your details and land records\n'
            '6. If approved, you will get your KCC within 14 working days\n'
            '7. The bank will set your credit limit based on your land and crop\n'
            '8. You can withdraw money as needed and repay after harvest\n'
            '9. Pay interest on time to get the government interest subsidy (4% instead of 7%)'
        ),
        'official_link': 'https://www.myscheme.gov.in/schemes/kcc',
        'state': 'All India',
        'category': 'loan',
    },
]


def seed_schemes(apps, schema_editor):
    Scheme = apps.get_model('schemes', 'Scheme')
    for data in SCHEMES:
        Scheme.objects.update_or_create(slug=data['slug'], defaults=data)


def remove_schemes(apps, schema_editor):
    Scheme = apps.get_model('schemes', 'Scheme')
    Scheme.objects.filter(slug__in=[s['slug'] for s in SCHEMES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('schemes', '0002_govupdate'),
    ]

    operations = [
        migrations.RunPython(seed_schemes, remove_schemes),
    ]
