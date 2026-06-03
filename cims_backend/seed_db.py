import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cims_project.settings')
django.setup()

from django.contrib.auth.models import User as DjangoUser
from incidents.models import Role, IncidentStatus, Priority, IncidentCategory, App, ThreatFeed, User, Ioc

def seed():
    print("Seeding lookups and test accounts...")

    # 1. Seed Roles
    admin_role, _ = Role.objects.get_or_create(role_name='Admin')
    analyst_role, _ = Role.objects.get_or_create(role_name='Analyst')
    manager_role, _ = Role.objects.get_or_create(role_name='Manager')
    print("  [OK] Seeded Roles.")

    # 2. Seed Incident Statuses
    statuses = ['New', 'Investigating', 'Contained', 'Eradicated', 'Recovered', 'Closed']
    for st in statuses:
        IncidentStatus.objects.get_or_create(status_name=st)
    print("  [OK] Seeded Incident Statuses.")

    # 3. Seed Priorities
    priorities = ['Critical', 'High', 'Medium', 'Low']
    for pr in priorities:
        Priority.objects.get_or_create(priority_level=pr)
    print("  [OK] Seeded Priorities.")

    # 4. Seed Incident Categories
    med_priority = Priority.objects.filter(priority_level='Medium').first()
    categories = ['Phishing', 'Malware', 'DDoS', 'Unauthorized Access', 'Data Leak']
    for cat in categories:
        IncidentCategory.objects.get_or_create(category_name=cat, default_priority=med_priority)
    print("  [OK] Seeded Incident Categories.")

    # 5. Seed Apps (Assets)
    App.objects.get_or_create(app_name='Corporate Email Server', app_type='Mail Server', ip_address='192.168.1.10', hostname='mail.corp.local')
    App.objects.get_or_create(app_name='AD Domain Controller', app_type='Identity Provider', ip_address='192.168.1.2', hostname='dc.corp.local')
    App.objects.get_or_create(app_name='HR Portal Portal', app_type='Web Application', ip_address='10.0.4.5', hostname='hr.corp.local')
    print("  [OK] Seeded Apps (Assets).")

    # 6. Seed Threat Feeds
    feed1, _ = ThreatFeed.objects.get_or_create(feed_name='Abuse.ch URLhaus', source_url='https://urlhaus.abuse.ch/api/')
    feed2, _ = ThreatFeed.objects.get_or_create(feed_name='PhishTank Feed', source_url='http://data.phishtank.com/data/online-valid.json')
    print("  [OK] Seeded Threat Feeds.")

    # 7. Seed IOCs
    Ioc.objects.get_or_create(ioc_type='IP', ioc_value='185.220.101.101', feed=feed1)
    Ioc.objects.get_or_create(ioc_type='Domain', ioc_value='phishing-corp-update.net', feed=feed2)
    print("  [OK] Seeded IOCs.")

    # 8. Seed CIMS Users & Django Auth Users
    # Admin User
    admin_cims, _ = User.objects.get_or_create(username='admin', full_name='CIMS Admin', phone_number='+1-555-0100', role=admin_role)
    if not DjangoUser.objects.filter(username='admin').exists():
        DjangoUser.objects.create_superuser(username='admin', email='admin@cims.local', password='admin123')
        print("  [OK] Created Django superuser 'admin' with password 'admin123'")
    else:
        print("  [INFO] Django user 'admin' already exists.")

    # Analyst User
    analyst_cims, _ = User.objects.get_or_create(username='analyst', full_name='CIMS Analyst', phone_number='+1-555-0101', role=analyst_role)
    if not DjangoUser.objects.filter(username='analyst').exists():
        DjangoUser.objects.create_user(username='analyst', email='analyst@cims.local', password='analyst123', is_staff=False)
        print("  [OK] Created Django user 'analyst' with password 'analyst123'")
    else:
        print("  [INFO] Django user 'analyst' already exists.")

    print("\nDatabase seeding completed successfully!")

if __name__ == '__main__':
    seed()
