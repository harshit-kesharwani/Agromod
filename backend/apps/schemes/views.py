from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Scheme
from .serializers import SchemeSerializer


class SchemeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        schemes = Scheme.objects.all().order_by('-created_at')
        return Response(SchemeSerializer(schemes, many=True).data)


class SchemeCheckEligibilityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            scheme = Scheme.objects.get(slug=slug)
        except Scheme.DoesNotExist:
            return Response({'detail': 'Scheme not found'}, status=status.HTTP_404_NOT_FOUND)

        land = request.data.get('land_holding', '').strip()
        crop = request.data.get('crop', '').strip()
        state = request.data.get('state', '').strip()
        income = request.data.get('income', '').strip()

        result_lines = [f'Eligibility check for: {scheme.name}', '']

        if scheme.slug in ('pm-kisan', 'pm-kisan-samman-nidhi'):
            land_ownership = request.data.get('land_ownership', '').strip().lower()
            has_bank_account = request.data.get('has_bank_account', '').strip().lower()
            has_aadhaar = request.data.get('has_aadhaar', '').strip().lower()
            is_govt_employee = request.data.get('is_govt_employee', '').strip().lower()
            pays_income_tax = request.data.get('pays_income_tax', '').strip().lower()
            family_members = request.data.get('family_members', '').strip()

            eligible = True
            reasons = []
            missing = []

            # -- Land ownership --
            if not land_ownership:
                missing.append('Whether you own farming land')
            elif land_ownership == 'no_land':
                eligible = False
                reasons.append(
                    'PM-KISAN is only for farmers who own farming land. '
                    'If you farm on someone else\'s land but don\'t own any land yourself, '
                    'you cannot get this benefit right now.'
                )

            # -- Land holding --
            if not land:
                missing.append('How much farming land you have')

            # -- Bank account --
            if not has_bank_account:
                missing.append('Whether you have a bank account')
            elif has_bank_account == 'no':
                eligible = False
                reasons.append(
                    'You need a bank account to receive PM-KISAN money. '
                    'The government sends Rs 2,000 directly to your bank account every 4 months. '
                    'Open a bank account at any bank near you - it is free.'
                )

            # -- Aadhaar --
            if not has_aadhaar:
                missing.append('Whether you have an Aadhaar card')
            elif has_aadhaar == 'no':
                eligible = False
                reasons.append(
                    'Aadhaar card is required to register for PM-KISAN. '
                    'Visit your nearest Aadhaar enrollment center to get one. It is free.'
                )

            # -- Government employee --
            if not is_govt_employee:
                missing.append('Whether anyone in your family works in government')
            elif is_govt_employee == 'yes':
                eligible = False
                reasons.append(
                    'If any member of your family is a government employee (central or state), '
                    'your family cannot get PM-KISAN benefit. '
                    'This includes retired employees who get a pension of Rs 10,000 or more per month.'
                )

            # -- Income tax --
            if not pays_income_tax:
                missing.append('Whether anyone in your family pays income tax')
            elif pays_income_tax == 'yes':
                eligible = False
                reasons.append(
                    'If any member of your family pays income tax, '
                    'your family cannot get PM-KISAN benefit.'
                )

            # -- State --
            if not state:
                missing.append('Your state')

            if missing:
                result_lines.append('Please fill in these details so we can check:')
                result_lines.extend(f'  \u2022 {m}' for m in missing)
                if len(missing) > 3:
                    return Response({'result': '\n'.join(result_lines)})

            if not eligible:
                result_lines.append('Sorry, you are NOT ELIGIBLE for PM-KISAN right now.')
                result_lines.append('')
                result_lines.append('Here is why:')
                for i, r in enumerate(reasons, 1):
                    result_lines.append(f'  {i}. {r}')
                result_lines.append('')
                result_lines.append('What you can do:')
                for r in reasons:
                    if 'own farming land' in r.lower():
                        result_lines.append('  \u2022 If you buy land in the future, you can apply then.')
                        result_lines.append('  \u2022 Check other schemes like KCC or PMFBY that may help you.')
                    elif 'bank account' in r.lower():
                        result_lines.append('  \u2022 Go to any bank with your Aadhaar card to open a free account.')
                        result_lines.append('  \u2022 Jan Dhan accounts can be opened with zero balance.')
                    elif 'aadhaar' in r.lower():
                        result_lines.append('  \u2022 Visit your nearest Aadhaar enrollment center.')
                        result_lines.append('  \u2022 Take any old ID (ration card, voter ID) along with you.')
                    elif 'government employee' in r.lower():
                        result_lines.append('  \u2022 This rule applies to the whole family, not just you.')
                        result_lines.append('  \u2022 If the government employee retires and pension is below Rs 10,000/month, you can apply.')
                    elif 'income tax' in r.lower():
                        result_lines.append('  \u2022 If your family stops paying income tax in the future, you can apply then.')
            else:
                result_lines.append('Good news! You are ELIGIBLE for PM-KISAN!')
                result_lines.append('')
                result_lines.append('What you will get:')
                result_lines.append('  \u2022 Rs 6,000 per year directly in your bank account')
                result_lines.append('  \u2022 Money comes in 3 installments of Rs 2,000 each')
                result_lines.append('  \u2022 April-July, August-November, December-March')
                result_lines.append('')
                result_lines.append('Your details:')
                if land:
                    result_lines.append(f'  \u2022 Land: {land}')
                if state:
                    result_lines.append(f'  \u2022 State: {state}')
                if family_members:
                    result_lines.append(f'  \u2022 Family members: {family_members}')
                result_lines.append('')
                result_lines.append('How to apply:')
                result_lines.append('  1. Go to your nearest CSC center (Common Service Center) or visit pmkisan.gov.in')
                result_lines.append('  2. Take these papers: Aadhaar card, land papers (khatauni), bank passbook')
                result_lines.append('  3. The CSC operator will fill the form for you')
                result_lines.append('  4. You will get an SMS when your application is approved')
                result_lines.append('  5. Money will start coming to your bank account')

        elif scheme.slug == 'pmfby':
            land_ownership = request.data.get('land_ownership', '').strip().lower()
            crop_season = request.data.get('crop_season', '').strip().lower()
            has_bank_account = request.data.get('has_bank_account', '').strip().lower()
            has_aadhaar = request.data.get('has_aadhaar', '').strip().lower()
            has_land_records = request.data.get('has_land_records', '').strip().lower()
            previous_claim = request.data.get('previous_claim', '').strip().lower()

            eligible = True
            reasons = []
            missing = []

            # -- Land holding --
            if not land:
                missing.append('How much land you farm on')

            # -- Land ownership --
            if not land_ownership:
                missing.append('Whether you own the land or farm on someone else\'s land')

            # -- Crop --
            if not crop:
                missing.append('What crop you grow')

            # -- Crop season --
            if not crop_season:
                missing.append('Which season you grow your crop in')

            # -- State --
            if not state:
                missing.append('Your state and district')

            # -- Bank account --
            if not has_bank_account:
                missing.append('Whether you have a bank account')
            elif has_bank_account == 'no':
                eligible = False
                reasons.append(
                    'You need a bank account to get the insurance money if your crop is damaged. '
                    'Open a bank account at any bank near you - it is free.'
                )

            # -- Aadhaar --
            if not has_aadhaar:
                missing.append('Whether you have an Aadhaar card')
            elif has_aadhaar == 'no':
                eligible = False
                reasons.append(
                    'Aadhaar card is needed to register for PMFBY. '
                    'Visit your nearest Aadhaar enrollment center to get one for free.'
                )

            # -- Land records --
            if not has_land_records:
                missing.append('Whether you have land papers or lease agreement')
            elif has_land_records == 'no':
                eligible = False
                reasons.append(
                    'You need land papers (khatauni) if you own the land, '
                    'or a lease/agreement from the landowner if you farm on someone else\'s land. '
                    'Visit your Tehsil office or Patwari to get your land records.'
                )

            if missing:
                result_lines.append('Please fill in these details so we can check:')
                result_lines.extend(f'  \u2022 {m}' for m in missing)
                if len(missing) > 3:
                    return Response({'result': '\n'.join(result_lines)})

            if not eligible:
                result_lines.append('Sorry, you are NOT ELIGIBLE for PMFBY right now.')
                result_lines.append('')
                result_lines.append('Here is why:')
                for i, r in enumerate(reasons, 1):
                    result_lines.append(f'  {i}. {r}')
                result_lines.append('')
                result_lines.append('What you can do:')
                for r in reasons:
                    if 'bank account' in r.lower():
                        result_lines.append('  \u2022 Go to any bank with your Aadhaar card to open a free account.')
                        result_lines.append('  \u2022 Jan Dhan accounts can be opened with zero balance.')
                    elif 'aadhaar' in r.lower():
                        result_lines.append('  \u2022 Visit your nearest Aadhaar enrollment center.')
                        result_lines.append('  \u2022 Take any old ID (ration card, voter ID) along with you.')
                    elif 'land papers' in r.lower() or 'land records' in r.lower():
                        result_lines.append('  \u2022 Visit your Tehsil / Patwari office to get land records.')
                        result_lines.append('  \u2022 If you farm on someone else\'s land, ask the landowner for a written agreement.')
            else:
                premium_info = '2% of the insured amount'
                if crop_season == 'kharif':
                    premium_info = '2% of the insured amount (Kharif season)'
                elif crop_season == 'rabi':
                    premium_info = '1.5% of the insured amount (Rabi season)'
                elif crop_season in ('commercial', 'horticultural'):
                    premium_info = '5% of the insured amount (commercial/horticultural crop)'

                result_lines.append('Good news! You are ELIGIBLE for PMFBY crop insurance!')
                result_lines.append('')
                result_lines.append('What you will get:')
                result_lines.append('  \u2022 Your crop will be insured against natural disasters (flood, drought, hail, storms)')
                result_lines.append('  \u2022 Also covers damage from pests and diseases')
                result_lines.append(f'  \u2022 You only pay a small premium: {premium_info}')
                result_lines.append('  \u2022 Government pays the rest of the premium for you')
                result_lines.append('  \u2022 If your crop is damaged, you will get money in your bank account')
                result_lines.append('')
                result_lines.append('Your details:')
                if land:
                    result_lines.append(f'  \u2022 Land: {land}')
                if crop:
                    result_lines.append(f'  \u2022 Crop: {crop}')
                if crop_season:
                    season_labels = {'kharif': 'Kharif (monsoon)', 'rabi': 'Rabi (winter)', 'zaid': 'Zaid (summer)', 'commercial': 'Commercial', 'horticultural': 'Horticultural'}
                    result_lines.append(f'  \u2022 Season: {season_labels.get(crop_season, crop_season)}')
                if land_ownership == 'own_land':
                    result_lines.append('  \u2022 You own the land')
                elif land_ownership == 'others_land':
                    result_lines.append('  \u2022 You farm on someone else\'s land')
                result_lines.append('')
                result_lines.append('How to apply:')
                result_lines.append('  1. Go to your nearest bank branch, CSC center, or visit pmfby.gov.in')
                result_lines.append('  2. Take these papers:')
                if land_ownership == 'own_land':
                    result_lines.append('     - Aadhaar card, land papers (khatauni), bank passbook')
                else:
                    result_lines.append('     - Aadhaar card, lease/agreement from landowner, bank passbook')
                result_lines.append('     - Sowing certificate (ask your Patwari)')
                result_lines.append('  3. Pay the premium amount and get your insurance policy')
                result_lines.append('  4. If crop gets damaged, call helpline 14447 within 72 hours')
                result_lines.append('  5. You can also report crop loss on the PMFBY mobile app')

        elif scheme.slug == 'kcc':
            age_str = request.data.get('age', '').strip()
            land_ownership = request.data.get('land_ownership', '').strip().lower()
            has_bank_account = request.data.get('has_bank_account', '').strip().lower()
            pending_loan = request.data.get('pending_loan', '').strip().lower()
            has_id_proof = request.data.get('has_id_proof', '').strip().lower()

            eligible = True
            reasons = []
            missing = []

            # -- Age check --
            if not age_str:
                missing.append('Your age')
            else:
                try:
                    age = int(age_str)
                    if age < 18:
                        eligible = False
                        reasons.append(
                            f'You are {age} years old. You need to be at least 18 years old to apply for KCC.'
                        )
                    elif age > 75:
                        eligible = False
                        reasons.append(
                            f'You are {age} years old. KCC is available for people up to 75 years of age. '
                            'A family member between 18-75 years can apply instead.'
                        )
                except ValueError:
                    missing.append('Your age (please enter a number)')

            # -- Land check --
            if not land:
                missing.append('How much land you farm on')
            else:
                try:
                    land_val = float(land.split()[0])
                    if land_val <= 0:
                        eligible = False
                        reasons.append(
                            'You need some farming land to get KCC. '
                            'Even if you farm on someone else\'s land, you can still apply.'
                        )
                except (ValueError, IndexError):
                    pass

            # -- Land ownership --
            if not land_ownership:
                missing.append('Whether you own the land or farm on someone else\'s land')
            # Both own_land and others_land are eligible, just different docs needed

            # -- Bank account --
            if not has_bank_account:
                missing.append('Whether you have a bank account')
            elif has_bank_account == 'no':
                eligible = False
                reasons.append(
                    'You need a bank account to get KCC. '
                    'You can open one at any bank near you for free. '
                    'Take your Aadhaar card to any bank branch and they will help you open an account.'
                )

            # -- Pending loan --
            if pending_loan == 'yes':
                eligible = False
                reasons.append(
                    'If you have an unpaid old loan from a bank, you cannot get a new KCC right now. '
                    'First, talk to your bank about clearing or settling the old loan. '
                    'Once that is done, you can apply for KCC.'
                )

            # -- ID proof --
            if not has_id_proof:
                missing.append('Whether you have Aadhaar card or any ID proof')
            elif has_id_proof == 'no':
                eligible = False
                reasons.append(
                    'You need at least one ID proof to apply for KCC. '
                    'Aadhaar card is the easiest option. You can also use Voter ID or Ration Card. '
                    'Visit your nearest Aadhaar center to get one made for free.'
                )

            # -- Crop --
            if not crop:
                missing.append('What crop you grow')

            # -- State --
            if not state:
                missing.append('Your state')

            if missing:
                result_lines.append('Please fill in these details so we can check:')
                result_lines.extend(f'  \u2022 {m}' for m in missing)
                if len(missing) > 3:
                    return Response({'result': '\n'.join(result_lines)})

            if not eligible:
                result_lines.append('Sorry, you are NOT ELIGIBLE for Kisan Credit Card right now.')
                result_lines.append('')
                result_lines.append('Here is why:')
                for i, r in enumerate(reasons, 1):
                    result_lines.append(f'  {i}. {r}')
                result_lines.append('')
                result_lines.append('What you can do:')
                for r in reasons:
                    if '18 years old' in r.lower():
                        result_lines.append('  \u2022 You can apply once you turn 18.')
                        result_lines.append('  \u2022 Until then, a parent or guardian can apply for KCC in their name.')
                    elif '75' in r and 'age' in r.lower():
                        result_lines.append('  \u2022 Ask a younger family member (18-75 years) to apply instead.')
                    elif 'unpaid' in r.lower() or 'old loan' in r.lower():
                        result_lines.append('  \u2022 Visit your bank and ask how to settle the old loan.')
                        result_lines.append('  \u2022 Get a "No Dues" letter from the bank after settling.')
                    elif 'bank account' in r.lower():
                        result_lines.append('  \u2022 Go to any bank with your Aadhaar card to open a free account.')
                        result_lines.append('  \u2022 Jan Dhan accounts can be opened with zero balance.')
                    elif 'id proof' in r.lower():
                        result_lines.append('  \u2022 Visit your nearest Aadhaar enrollment center.')
                        result_lines.append('  \u2022 You can also use Voter ID or Ration Card.')
                    elif 'land' in r.lower():
                        result_lines.append('  \u2022 If you farm on someone else\'s land, get a written agreement from the landowner.')
            else:
                result_lines.append('Good news! You are ELIGIBLE for Kisan Credit Card!')
                result_lines.append('')
                result_lines.append('What you will get:')
                result_lines.append('  \u2022 Loan up to Rs 3 lakh for farming at just 4% interest per year')
                result_lines.append('  \u2022 Card is valid for 5 years')
                result_lines.append('  \u2022 Free insurance cover of Rs 50,000')
                result_lines.append('  \u2022 Buy seeds, fertilizer, pesticides on credit')
                result_lines.append('')
                result_lines.append(f'Your details:')
                result_lines.append(f'  \u2022 Land: {land}')
                if crop:
                    result_lines.append(f'  \u2022 Crop: {crop}')
                if land_ownership == 'own_land':
                    result_lines.append('  \u2022 You own the land')
                else:
                    result_lines.append('  \u2022 You farm on someone else\'s land')
                result_lines.append('')
                result_lines.append('What to do next:')
                result_lines.append('  1. Go to your nearest bank (SBI, cooperative bank, or gramin bank)')
                if land_ownership == 'own_land':
                    result_lines.append('  2. Take these papers: Aadhaar card, land papers (khatauni), bank passbook, 2 photos')
                else:
                    result_lines.append('  2. Take these papers: Aadhaar card, lease/agreement from landowner, bank passbook, 2 photos')
                result_lines.append('  3. Ask for KCC application form and fill it')
                result_lines.append('  4. Bank will check your details and give you the card in 2-3 weeks')

        else:
            result_lines.append(f'Eligibility criteria: {scheme.eligibility_criteria}')
            if land or crop or state:
                result_lines.append('Please check with your local agriculture office for detailed eligibility.')

        return Response({'result': '\n'.join(result_lines)})
