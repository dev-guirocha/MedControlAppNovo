// Entry do app. Carrega antes de tudo o módulo que define a task dos botões da notificação:
// com o app fechado, o Android sobe só este bundle para rodar a task, sem montar as telas.
import './lib/doseNotificationActions';
import 'expo-router/entry';
