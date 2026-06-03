from rest_framework import serializers
from .models import *


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.role_name', read_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'username', 'full_name', 'role', 'role_name', 'phone_number']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class IncidentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentStatus
        fields = '__all__'


class PrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = Priority
        fields = '__all__'


class IncidentCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent_category.category_name', read_only=True)
    default_priority_name = serializers.CharField(source='default_priority.priority_level', read_only=True)

    class Meta:
        model = IncidentCategory
        fields = ['category_id', 'category_name', 'parent_category', 'parent_name',
                  'default_priority', 'default_priority_name']


class TeamSerializer(serializers.ModelSerializer):
    team_lead_name = serializers.CharField(source='team_lead.username', read_only=True)

    class Meta:
        model = Team
        fields = ['team_id', 'team_name', 'team_lead', 'team_lead_name', 'specialization']


class IncidentUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = IncidentUpdate
        fields = ['update_id', 'incident', 'updated_by', 'updated_by_name', 'update_message', 'changed_at']
        read_only_fields = ['changed_at']


class IncidentAssetSerializer(serializers.ModelSerializer):
    app_name = serializers.CharField(source='app.app_name', read_only=True)

    class Meta:
        model = IncidentAsset
        fields = ['incident_asset_id', 'incident', 'app', 'app_name', 'impact_type']


class ResponseActionSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    incident_title = serializers.CharField(source='incident.title', read_only=True)

    class Meta:
        model = ResponseAction
        fields = '__all__'
        read_only_fields = ['action_id']


class EvidenceSerializer(serializers.ModelSerializer):
    collected_by_name = serializers.CharField(source='collected_by.username', read_only=True)

    class Meta:
        model = Evidence
        fields = '__all__'


class PlaybookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playbook
        fields = '__all__'


class PlaybookStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaybookStep
        fields = '__all__'


class IocSerializer(serializers.ModelSerializer):
    feed_name = serializers.CharField(source='feed.feed_name', read_only=True)

    class Meta:
        model = Ioc
        fields = '__all__'


class IncidentIocSerializer(serializers.ModelSerializer):
    ioc_value = serializers.CharField(source='ioc.ioc_value', read_only=True)
    ioc_type = serializers.CharField(source='ioc.ioc_type', read_only=True)
    matched_app_name = serializers.CharField(source='matched_app.app_name', read_only=True)

    class Meta:
        model = IncidentIoc
        fields = ['incident_ioc_id', 'incident', 'ioc', 'ioc_value', 'ioc_type', 'matched_app', 'matched_app_name']


class ThreatFeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreatFeed
        fields = '__all__'


class MetricsLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricsLog
        fields = ['metric_id', 'incident', 'metric_type', 'value_numeric', 'measured_at']
        read_only_fields = ['metric_id', 'measured_at']


class IncidentSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.status_name', read_only=True)
    priority_level = serializers.CharField(source='priority.priority_level', read_only=True)
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.team_name', read_only=True)
    updates = IncidentUpdateSerializer(many=True, read_only=True)
    assets = IncidentAssetSerializer(many=True, read_only=True)
    actions = ResponseActionSerializer(many=True, read_only=True)
    evidence_list = EvidenceSerializer(many=True, read_only=True)
    incident_iocs = IncidentIocSerializer(many=True, source='incidentioc_set', read_only=True)
    metrics_log = MetricsLogSerializer(many=True, source='metricslog_set', read_only=True)

    class Meta:
        model = Incident
        fields = '__all__'
        read_only_fields = ['incident_id', 'detection_date', 'created_at']


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['log_id', 'user', 'username', 'action_type', 'entity_name', 'entity_id', 'action_time']