import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cims_project.settings')
django.setup()

from incidents.models import ThreatFeed, AuditLog, User, Incident, App, Priority, IncidentStatus, IncidentCategory, Role

def check():
    models_to_check = {
        'Role': Role,
        'IncidentStatus': IncidentStatus,
        'Priority': Priority,
        'App': App,
        'ThreatFeed': ThreatFeed,
        'User': User,
        'IncidentCategory': IncidentCategory,
        'Incident': Incident,
        'AuditLog': AuditLog
    }
    
    print("Checking Django MySQL Database models connection:")
    for name, model in models_to_check.items():
        try:
            count = model.objects.count()
            print(f"  [OK] Model '{name}' maps successfully. Row count: {count}")
        except Exception as e:
            print(f"  [ERROR] Model '{name}' failed: {e}")

if __name__ == "__main__":
    check()
