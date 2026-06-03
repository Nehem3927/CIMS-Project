from django.db import models
from django.contrib.auth.models import AbstractUser

# ==================================================
# 1. LOOKUP & REFERENCE TABLES
# ==================================================

class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'
        managed = False

    def __str__(self):
        return self.role_name


class IncidentStatus(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'incident_status'
        managed = False

    def __str__(self):
        return self.status_name


class Priority(models.Model):
    priority_id = models.AutoField(primary_key=True)
    priority_level = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'priorities'
        managed = False

    def __str__(self):
        return self.priority_level


class App(models.Model):
    app_id = models.AutoField(primary_key=True)
    app_name = models.CharField(max_length=100)
    app_type = models.CharField(max_length=50, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    hostname = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'apps'
        managed = False

    def __str__(self):
        return self.app_name


class Playbook(models.Model):
    playbook_id = models.AutoField(primary_key=True)
    playbook_name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'playbooks'
        managed = False

    def __str__(self):
        return self.playbook_name


class ThreatFeed(models.Model):
    feed_id = models.AutoField(primary_key=True)
    feed_name = models.CharField(max_length=100)
    source_url = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'threat_feeds'
        managed = False

    def __str__(self):
        return self.feed_name


# ==================================================
# 2. USER, TEAM & CATEGORY MANAGEMENT
# ==================================================

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    channel_id = models.CharField(max_length=100, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, db_column='role_id')

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return self.username


class Team(models.Model):
    team_id = models.AutoField(primary_key=True)
    team_name = models.CharField(max_length=100, unique=True)
    team_lead = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='team_lead')
    specialization = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'teams'
        managed = False

    def __str__(self):
        return self.team_name


class IncidentCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100, unique=True)
    parent_category = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, db_column='parent_category_id')
    default_priority = models.ForeignKey(Priority, on_delete=models.SET_NULL, null=True, blank=True, db_column='default_priority_id')

    class Meta:
        db_table = 'incident_categories'
        managed = False

    def __str__(self):
        return self.category_name


# ==================================================
# 3. CORE INCIDENT MANAGEMENT
# ==================================================

class Incident(models.Model):
    incident_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    detection_date = models.DateTimeField(auto_now_add=True)
    status = models.ForeignKey(IncidentStatus, on_delete=models.SET_DEFAULT, default=1, db_column='status_id')
    priority = models.ForeignKey(Priority, on_delete=models.SET_NULL, null=True, blank=True, db_column='priority_id')
    category = models.ForeignKey(IncidentCategory, on_delete=models.PROTECT, db_column='category_id')  # NOT NULL – business rule
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_incidents', db_column='reported_by')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_incidents', db_column='assigned_to')
    assigned_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, db_column='assigned_team')
    lessons_learned = models.TextField(blank=True)
    resolved_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'incidents'
        managed = False

    def __str__(self):
        return self.title


# ==================================================
# 4. JUNCTION TABLES
# ==================================================

class IncidentAsset(models.Model):
    incident_asset_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    app = models.ForeignKey(App, on_delete=models.CASCADE, db_column='app_id')
    impact_type = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'incident_assets'
        managed = False
        unique_together = (('incident', 'app'),)


class IncidentPlaybook(models.Model):
    incident_playbook_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    playbook = models.ForeignKey(Playbook, on_delete=models.CASCADE, db_column='playbook_id')
    steps_followed = models.TextField(blank=True)

    class Meta:
        db_table = 'incident_playbooks'
        managed = False


# ==================================================
# 5. THREAT INTELLIGENCE
# ==================================================

class Ioc(models.Model):
    ioc_id = models.AutoField(primary_key=True)
    ioc_type = models.CharField(max_length=50)
    ioc_value = models.CharField(max_length=255)
    feed = models.ForeignKey(ThreatFeed, on_delete=models.SET_NULL, null=True, blank=True, db_column='feed_id')

    class Meta:
        db_table = 'iocs'
        managed = False
        unique_together = (('ioc_type', 'ioc_value'),)

    def __str__(self):
        return f"{self.ioc_type}: {self.ioc_value}"


class IncidentIoc(models.Model):
    incident_ioc_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    ioc = models.ForeignKey(Ioc, on_delete=models.CASCADE, db_column='ioc_id')
    matched_app = models.ForeignKey(App, on_delete=models.SET_NULL, null=True, blank=True, db_column='matched_app_id')

    class Meta:
        db_table = 'incident_iocs'
        managed = False
        unique_together = (('incident', 'ioc'),)


# ==================================================
# 6. LOGGING, EVIDENCE, METRICS
# ==================================================

class IncidentUpdate(models.Model):
    update_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='updated_by')
    update_message = models.TextField()
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'incident_updates'
        managed = False


class Evidence(models.Model):
    evidence_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='collected_by')
    file_path = models.CharField(max_length=255)
    collected_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evidence'
        managed = False


class MetricsLog(models.Model):
    metric_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    metric_type = models.CharField(max_length=100)
    value_numeric = models.DecimalField(max_digits=10, decimal_places=2)
    measured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'metrics_log'
        managed = False


class ResponseAction(models.Model):
    action_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, db_column='incident_id')
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='performed_by')
    target = models.ForeignKey(IncidentAsset, on_delete=models.SET_NULL, null=True, blank=True, db_column='target_id')
    action_type = models.CharField(max_length=100)
    was_successful = models.BooleanField(default=False)

    class Meta:
        db_table = 'response_actions'
        managed = False


class PlaybookStep(models.Model):
    step_id = models.AutoField(primary_key=True)
    playbook = models.ForeignKey(Playbook, on_delete=models.CASCADE, db_column='playbook_id')
    step_number = models.IntegerField()
    step_description = models.TextField()

    class Meta:
        db_table = 'playbook_steps'
        managed = False
        unique_together = (('playbook', 'step_number'),)


class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')
    action_type = models.CharField(max_length=100, blank=True)
    entity_name = models.CharField(max_length=100, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)
    action_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        managed = False