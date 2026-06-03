from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Count, Q, F, ExpressionWrapper, DurationField, Avg
from datetime import timedelta
from .models import *
from .serializers import *

# ─────────────────────────────────────────────────────────
# Custom permissions
# ─────────────────────────────────────────────────────────

class IsAnalyst(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class IsManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_staff


# ─────────────────────────────────────────────────────────
# Current User
# ─────────────────────────────────────────────────────────

from rest_framework.views import APIView


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        django_user = request.user
        role_name = 'Analyst'
        try:
            custom_user = User.objects.get(username=django_user.username)
            if custom_user.role:
                role_name = custom_user.role.role_name
        except User.DoesNotExist:
            if django_user.is_staff:
                role_name = 'Admin'

        return Response({
            'username': django_user.username,
            'role': role_name,
            'is_staff': django_user.is_staff
        })

    def post(self, request):
        django_user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Both old and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not django_user.check_password(old_password):
            return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        django_user.set_password(new_password)
        django_user.save()

        return Response({'message': 'Password updated successfully.'})


# ─────────────────────────────────────────────────────────
# Incidents
# ─────────────────────────────────────────────────────────

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-incident_id')
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]

    def get_queryset(self):
        queryset = Incident.objects.all().order_by('-incident_id')
        search = self.request.query_params.get('search', None)
        status_filter = self.request.query_params.get('status', None)
        priority = self.request.query_params.get('priority', None)
        category = self.request.query_params.get('category', None)

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if status_filter:
            queryset = queryset.filter(status_id=status_filter)
        if priority:
            queryset = queryset.filter(priority_id=priority)
        if category:
            queryset = queryset.filter(category_id=category)

        return queryset

    def perform_create(self, serializer):
        serializer.save(reported_by=None)

    @action(detail=True, methods=['post'])
    def add_update(self, request, pk=None):
        incident = self.get_object()
        serializer = IncidentUpdateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(incident=incident, updated_by=None)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_evidence(self, request, pk=None):
        incident = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        evidence = Evidence.objects.create(
            incident=incident,
            collected_by=None,
            file_path=file.name,
        )
        # Save actual file to media
        import os
        from django.conf import settings
        media_dir = getattr(settings, 'MEDIA_ROOT', 'media')
        os.makedirs(media_dir, exist_ok=True)
        file_path = os.path.join(media_dir, file.name)
        with open(file_path, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)
        evidence.file_path = file.name
        evidence.save()
        return Response(EvidenceSerializer(evidence).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def export(self, request):
        import csv
        from django.http import HttpResponse

        queryset = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="incidents_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Title', 'Description', 'Status', 'Priority', 'Category',
                         'Detection Date', 'Resolved Date', 'Assigned To'])

        for inc in queryset:
            writer.writerow([
                inc.incident_id,
                inc.title,
                inc.description or '',
                inc.status.status_name if inc.status else '',
                inc.priority.priority_level if inc.priority else 'N/A',
                inc.category.category_name if inc.category else '',
                inc.detection_date.strftime('%Y-%m-%d %H:%M:%S') if inc.detection_date else '',
                inc.resolved_date.strftime('%Y-%m-%d %H:%M:%S') if inc.resolved_date else 'Not resolved',
                inc.assigned_to.username if inc.assigned_to else 'Unassigned'
            ])

        return response


# ─────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────

from django.contrib.auth.models import User as DjangoUser


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]

    def perform_create(self, serializer):
        user = serializer.save()
        if not DjangoUser.objects.filter(username=user.username).exists():
            DjangoUser.objects.create_user(
                username=user.username,
                password='cimsdefault123',
                is_staff=(user.role.role_name == 'Admin') if user.role else False
            )

    def perform_update(self, serializer):
        user = serializer.save()
        try:
            dj_user = DjangoUser.objects.get(username=user.username)
            dj_user.is_staff = (user.role.role_name == 'Admin') if user.role else False
            dj_user.save()
        except DjangoUser.DoesNotExist:
            pass

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        try:
            DjangoUser.objects.get(username=username).delete()
        except DjangoUser.DoesNotExist:
            pass


# ─────────────────────────────────────────────────────────
# Lookup ViewSets
# ─────────────────────────────────────────────────────────

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]


class IncidentStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IncidentStatus.objects.all()
    serializer_class = IncidentStatusSerializer
    permission_classes = [permissions.IsAuthenticated]


class PriorityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Priority.objects.all()
    serializer_class = PrioritySerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryViewSet(viewsets.ModelViewSet):
    """Writable for managers; read-only for analysts."""
    queryset = IncidentCategory.objects.all()
    serializer_class = IncidentCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]


# ─────────────────────────────────────────────────────────
# Playbooks (now writable)
# ─────────────────────────────────────────────────────────

class PlaybookViewSet(viewsets.ModelViewSet):
    queryset = Playbook.objects.all()
    serializer_class = PlaybookSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


class PlaybookStepViewSet(viewsets.ModelViewSet):
    queryset = PlaybookStep.objects.all()
    serializer_class = PlaybookStepSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]

    def get_queryset(self):
        queryset = PlaybookStep.objects.all().order_by('step_number')
        playbook_id = self.request.query_params.get('playbook', None)
        if playbook_id:
            queryset = queryset.filter(playbook_id=playbook_id)
        return queryset


# ─────────────────────────────────────────────────────────
# Assets & IOCs
# ─────────────────────────────────────────────────────────

class AssetViewSet(viewsets.ModelViewSet):
    queryset = App.objects.all()
    serializer_class = AppSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


class IocViewSet(viewsets.ModelViewSet):
    queryset = Ioc.objects.all()
    serializer_class = IocSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


class ThreatFeedViewSet(viewsets.ModelViewSet):
    queryset = ThreatFeed.objects.all()
    serializer_class = ThreatFeedSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


class IncidentAssetViewSet(viewsets.ModelViewSet):
    queryset = IncidentAsset.objects.all()
    serializer_class = IncidentAssetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


class IncidentIocViewSet(viewsets.ModelViewSet):
    queryset = IncidentIoc.objects.all()
    serializer_class = IncidentIocSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]


# ─────────────────────────────────────────────────────────
# Response Actions (now registered standalone)
# ─────────────────────────────────────────────────────────

class ResponseActionViewSet(viewsets.ModelViewSet):
    queryset = ResponseAction.objects.all().order_by('-action_id')
    serializer_class = ResponseActionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]

    def get_queryset(self):
        queryset = ResponseAction.objects.all().order_by('-action_id')
        incident_id = self.request.query_params.get('incident', None)
        if incident_id:
            queryset = queryset.filter(incident_id=incident_id)
        return queryset


# ─────────────────────────────────────────────────────────
# Metrics Log
# ─────────────────────────────────────────────────────────

class MetricsLogViewSet(viewsets.ModelViewSet):
    queryset = MetricsLog.objects.all().order_by('-measured_at')
    serializer_class = MetricsLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAnalyst]

    def get_queryset(self):
        queryset = MetricsLog.objects.all().order_by('-measured_at')
        incident_id = self.request.query_params.get('incident', None)
        if incident_id:
            queryset = queryset.filter(incident_id=incident_id)
        return queryset


# ─────────────────────────────────────────────────────────
# Audit Logs
# ─────────────────────────────────────────────────────────

from rest_framework.pagination import PageNumberPagination


class AuditLogPagination(PageNumberPagination):
    page_size = 20


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-action_time')
    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-action_time')
        entity_name = self.request.query_params.get('entity_name', None)
        if entity_name:
            queryset = queryset.filter(entity_name__icontains=entity_name)
        return queryset


# ─────────────────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────────────────

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def kpi(self, request):
        open_incidents = Incident.objects.exclude(status__status_name='Closed').count()
        incidents_with_resolution = Incident.objects.filter(resolved_date__isnull=False)
        total_days = 0
        count = 0
        for inc in incidents_with_resolution:
            delta = inc.resolved_date - inc.detection_date
            total_days += delta.total_seconds() / 86400
            count += 1
        avg_days = round(total_days / count, 2) if count > 0 else 0

        incidents_by_priority = list(
            Incident.objects.values('priority__priority_level').annotate(count=Count('incident_id'))
        )
        incidents_by_category = list(
            Incident.objects.values('category__category_name').annotate(count=Count('incident_id'))
        )

        return Response({
            'open_incidents': open_incidents,
            'avg_resolution_days': avg_days,
            'incidents_by_priority': incidents_by_priority,
            'incidents_by_category': incidents_by_category,
        })

    @action(detail=False, methods=['get'])
    def trend(self, request):
        from django.utils import timezone
        import datetime

        today = timezone.now().date()
        trend_data = []

        for i in range(6, -1, -1):
            day = today - datetime.timedelta(days=i)
            count = Incident.objects.filter(created_at__date=day).count()
            trend_data.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': count
            })

        return Response(trend_data)