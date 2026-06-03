from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet)
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'incident-status', IncidentStatusViewSet)
router.register(r'priorities', PriorityViewSet)
router.register(r'playbooks', PlaybookViewSet)
router.register(r'playbook-steps', PlaybookStepViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'iocs', IocViewSet)
router.register(r'threat-feeds', ThreatFeedViewSet)
router.register(r'incident-assets', IncidentAssetViewSet)
router.register(r'incident-iocs', IncidentIocViewSet)
router.register(r'response-actions', ResponseActionViewSet)
router.register(r'metrics-log', MetricsLogViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('', include(router.urls)),
]