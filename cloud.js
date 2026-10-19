/* Dino Dominion V1.0 Build 1 — Cloud Kingdom synchronization.
 * Cloud data is account-scoped. Pre-V1 device save is deliberately retained.
 * This is cloud backup/sync, NOT server-authoritative competitive progression.
 */
(()=>{'use strict';
const client=window.DDOnlineClient, game=window.DDGameCloudBridge;
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Build 6.17.8c CRITICAL ONLY: presentation-local Cloud Kingdom warnings.
 * Cloud revision, save payloads, RPC calls, conflict resolution, backups and accounts are unchanged.
 * Unknown technical errors remain visible in original form, not guessed at. */
const CLOUD_COPY={"fr":{"💾 Device save · Sign in to enable cloud":"💾 Sauvegarde locale · Connectez-vous pour activer le cloud","☁️ Reading your cloud kingdom…":"☁️ Chargement de votre royaume cloud…","☁️ Import this device’s kingdom to start cloud saves":"☁️ Importez ce royaume pour commencer la sauvegarde cloud","☁️ Cloud kingdom saved":"☁️ Royaume sauvegardé dans le cloud","☁️ Saving your kingdom…":"☁️ Sauvegarde de votre royaume…","⚠️ Offline changes saved on this device — retry upload":"⚠️ Modifications conservées sur cet appareil — réessayez l’envoi","⚠️ Cloud conflict — choose which save to keep":"⚠️ Conflit de sauvegarde cloud — choisissez la version à conserver","⚠️ Cloud unavailable — device progress remains available":"⚠️ Cloud indisponible — votre progression locale reste accessible","☁️ Cloud Kingdom":"☁️ Royaume cloud","Cloud request timed out. Verify the server before retrying.":"La requête cloud a expiré. Vérifiez l’état du serveur avant de réessayer.","Another device has already changed this kingdom. Your unsynced progress is still kept on this device.":"Un autre appareil a déjà modifié ce royaume. Votre progression non synchronisée est conservée sur cet appareil.","Creation acknowledgement uncertain. Reconnect to inspect the cloud before trying again.":"La confirmation de création est incertaine. Reconnectez-vous et vérifiez le cloud avant de réessayer.","Device storage is full or blocked; do not close this page before saving.":"Le stockage de l’appareil est plein ou bloqué ; ne fermez pas cette page avant de sauvegarder.","The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.":"La version cloud a changé ailleurs. Votre copie locale est préservée ; choisissez une option de récupération.","Could not contact Supabase":"Impossible de contacter Supabase","No pending device save found":"Aucune sauvegarde locale en attente trouvée","Could not verify cloud revision. Local changes are safe; retry when connected.":"Impossible de vérifier la version cloud. Les modifications locales sont préservées ; réessayez une fois connecté.","Cloud read-back was invalid; nothing was uploaded.":"La lecture de vérification du cloud est invalide ; aucun envoi n’a été effectué.","Cloud is saved, but device cache could not be updated. Download a backup.":"Le cloud est sauvegardé, mais le cache local n’a pas pu être mis à jour. Téléchargez une sauvegarde.","Cloud revision changed. Download the device backup before choosing which copy to keep.":"La version cloud a changé. Téléchargez la sauvegarde locale avant de choisir la copie à conserver.","Game or Supabase client not available":"Le jeu ou le client Supabase est indisponible","Your game currently saves on this device. Sign in to enable account cloud saves.":"Votre partie est actuellement sauvegardée sur cet appareil. Connectez-vous pour activer la sauvegarde cloud du compte.","Checking your Supabase kingdom. Gameplay is briefly paused.":"Vérification de votre royaume Supabase. Le jeu est momentanément suspendu.","No cloud kingdom exists for this account yet.":"Ce compte ne possède pas encore de royaume cloud.","Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.":"Importez une seule fois la progression de cet appareil, ou choisissez explicitement de recommencer. Les données Alpha 0.9 de l’appareil resteront sauvegardées.","☁️ Import this device’s progress":"☁️ Importer la progression de cet appareil","Start a fresh cloud kingdom":"Commencer un nouveau royaume cloud","Your kingdom is saved to your account.":"Votre royaume est sauvegardé sur votre compte.","Changes are uploading to Supabase.":"Envoi des modifications vers Supabase.","Last confirmed:":"Dernière confirmation :","⬇️ Download kingdom backup":"⬇️ Télécharger une sauvegarde du royaume","Not uploaded yet:":"Pas encore envoyé :","Your unsynced changes are stored on this device.":"Vos modifications non synchronisées sont conservées sur cet appareil.","Retry upload":"Réessayer l’envoi","Download device backup":"Télécharger la sauvegarde locale","Load cloud instead":"Charger plutôt la version cloud","Cloud conflict:":"Conflit cloud :","We will NOT overwrite another device automatically.":"Nous n’écraserons PAS automatiquement la sauvegarde d’un autre appareil.","Try safe upload":"Tenter un envoi sécurisé","Use latest cloud version":"Utiliser la dernière version cloud","Cloud loading error:":"Erreur de chargement cloud :","Your original device save is not deleted.":"Votre sauvegarde locale d’origine n’a pas été supprimée.","Retry connection":"Réessayer la connexion","Download local backup":"Télécharger la sauvegarde locale","Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.":"Les sauvegardes cloud ne servent pas encore au JcJ compétitif ni aux classements de puissance. Ces systèmes nécessiteront une progression vérifiée par serveur dans une prochaine version.","Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.":"Créer un NOUVEAU royaume cloud avec les valeurs de départ ? Votre sauvegarde locale d’origine restera conservée sur cet appareil.","IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.":"IMPORTER le royaume de cet appareil vers ce compte ? Cela crée votre première sauvegarde cloud. Votre sauvegarde locale d’origine reste inchangée.","Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.":"Charger la dernière version du royaume CLOUD ? Vos modifications locales non synchronisées ne seront pas fusionnées. Téléchargez d’abord une sauvegarde de l’appareil si vous souhaitez les conserver.","Technical details (original):":"Détails techniques (texte original) :","guest":"Invité","loading":"Chargement","missing":"Absent","ready":"Sauvegardé","syncing":"Synchronisation","offline":"Hors ligne","conflict":"Conflit","error":"Erreur","Your latest kingdom changes are not yet uploaded. Sign out anyway? They will remain saved on this device.":"Les dernières modifications du royaume ne sont pas encore envoyées. Voulez-vous vous déconnecter ? Elles resteront sauvegardées sur cet appareil.","☁️ Resolve your cloud save before playing":"☁️ Résolvez le problème de sauvegarde cloud avant de jouer","☁️ Cloud save needs attention":"☁️ La sauvegarde cloud nécessite votre attention","Cloud feature unavailable":"Fonctionnalité cloud indisponible"},"ar":{"💾 Device save · Sign in to enable cloud":"💾 حفظ على الجهاز · سجّل الدخول لتفعيل الحفظ السحابي","☁️ Reading your cloud kingdom…":"☁️ جارٍ قراءة مملكتك السحابية…","☁️ Import this device’s kingdom to start cloud saves":"☁️ استورد مملكة هذا الجهاز لبدء الحفظ السحابي","☁️ Cloud kingdom saved":"☁️ تم حفظ المملكة سحابيًا","☁️ Saving your kingdom…":"☁️ جارٍ حفظ مملكتك…","⚠️ Offline changes saved on this device — retry upload":"⚠️ التغييرات محفوظة على هذا الجهاز دون اتصال — أعد محاولة الرفع","⚠️ Cloud conflict — choose which save to keep":"⚠️ تعارض في الحفظ السحابي — اختر النسخة التي تريد الاحتفاظ بها","⚠️ Cloud unavailable — device progress remains available":"⚠️ الحفظ السحابي غير متاح — تقدمك على الجهاز ما زال متاحًا","☁️ Cloud Kingdom":"☁️ المملكة السحابية","Cloud request timed out. Verify the server before retrying.":"انتهت مهلة طلب الحفظ السحابي. تحقق من حالة الخادم قبل إعادة المحاولة.","Another device has already changed this kingdom. Your unsynced progress is still kept on this device.":"غيّر جهاز آخر هذه المملكة بالفعل. لا يزال تقدمك غير المتزامن محفوظًا على هذا الجهاز.","Creation acknowledgement uncertain. Reconnect to inspect the cloud before trying again.":"تأكيد إنشاء المملكة غير مؤكد. أعد الاتصال وافحص الحفظ السحابي قبل المحاولة مجددًا.","Device storage is full or blocked; do not close this page before saving.":"مساحة تخزين الجهاز ممتلئة أو محظورة؛ لا تغلق هذه الصفحة قبل الحفظ.","The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.":"تم تحديث النسخة السحابية من مكان آخر. نسختك على الجهاز محفوظة؛ اختر طريقة الاسترداد.","Could not contact Supabase":"تعذر الاتصال بـ Supabase","No pending device save found":"لم يتم العثور على حفظ معلّق على الجهاز","Could not verify cloud revision. Local changes are safe; retry when connected.":"تعذر التحقق من إصدار الحفظ السحابي. التغييرات المحلية محفوظة؛ أعد المحاولة عند الاتصال.","Cloud read-back was invalid; nothing was uploaded.":"كانت قراءة التحقق من الحفظ السحابي غير صالحة؛ لم يتم رفع أي شيء.","Cloud is saved, but device cache could not be updated. Download a backup.":"تم الحفظ سحابيًا، لكن تعذر تحديث النسخة المحلية المؤقتة. نزّل نسخة احتياطية.","Cloud revision changed. Download the device backup before choosing which copy to keep.":"تغيّر إصدار الحفظ السحابي. نزّل نسخة الجهاز الاحتياطية قبل اختيار النسخة التي ستحتفظ بها.","Game or Supabase client not available":"اللعبة أو عميل Supabase غير متاح","Your game currently saves on this device. Sign in to enable account cloud saves.":"تُحفظ لعبتك حاليًا على هذا الجهاز. سجّل الدخول لتفعيل الحفظ السحابي للحساب.","Checking your Supabase kingdom. Gameplay is briefly paused.":"جارٍ التحقق من مملكتك على Supabase. اللعب متوقف مؤقتًا لفترة قصيرة.","No cloud kingdom exists for this account yet.":"لا توجد مملكة سحابية لهذا الحساب حتى الآن.","Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.":"استورد تقدم هذا الجهاز مرة واحدة، أو اختر البدء من جديد صراحةً. ستظل بيانات Alpha 0.9 الموجودة على الجهاز محفوظة احتياطيًا.","☁️ Import this device’s progress":"☁️ استيراد تقدم هذا الجهاز","Start a fresh cloud kingdom":"بدء مملكة سحابية جديدة","Your kingdom is saved to your account.":"تم حفظ مملكتك في حسابك.","Changes are uploading to Supabase.":"جارٍ رفع التغييرات إلى Supabase.","Last confirmed:":"آخر تأكيد:","⬇️ Download kingdom backup":"⬇️ تنزيل نسخة احتياطية للمملكة","Not uploaded yet:":"لم يُرفع بعد:","Your unsynced changes are stored on this device.":"تغييراتك غير المتزامنة محفوظة على هذا الجهاز.","Retry upload":"إعادة محاولة الرفع","Download device backup":"تنزيل نسخة احتياطية من الجهاز","Load cloud instead":"تحميل النسخة السحابية بدلًا منها","Cloud conflict:":"تعارض سحابي:","We will NOT overwrite another device automatically.":"لن نستبدل حفظ جهاز آخر تلقائيًا.","Try safe upload":"محاولة رفع آمنة","Use latest cloud version":"استخدام أحدث نسخة سحابية","Cloud loading error:":"خطأ في تحميل الحفظ السحابي:","Your original device save is not deleted.":"لم يُحذف حفظك الأصلي على الجهاز.","Retry connection":"إعادة محاولة الاتصال","Download local backup":"تنزيل نسخة احتياطية محلية","Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.":"لا تُستخدم النسخ السحابية بعد في قتال اللاعبين التنافسي أو تصنيفات القوة. سيتطلب ذلك تقدمًا يتحقق منه الخادم في إصدار مستقبلي.","Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.":"هل تريد إنشاء مملكة سحابية جديدة بقيم البداية؟ سيظل الحفظ الأصلي على جهازك محفوظًا احتياطيًا.","IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.":"هل تريد استيراد مملكة هذا الجهاز إلى الحساب؟ سيؤدي ذلك إلى إنشاء أول حفظ سحابي لك. سيبقى الحفظ المحلي الأصلي دون تغيير.","Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.":"هل تريد تحميل أحدث مملكة سحابية؟ لن تُدمج تغييرات الجهاز غير المتزامنة. نزّل نسخة احتياطية من الجهاز أولًا إذا كنت بحاجة إليها.","Technical details (original):":"التفاصيل التقنية (النص الأصلي):","guest":"ضيف","loading":"جارٍ التحميل","missing":"غير موجود","ready":"محفوظ","syncing":"جارٍ المزامنة","offline":"غير متصل","conflict":"تعارض","error":"خطأ","Your latest kingdom changes are not yet uploaded. Sign out anyway? They will remain saved on this device.":"لم تُرفع أحدث تغييرات المملكة بعد. هل تريد تسجيل الخروج رغم ذلك؟ ستبقى محفوظة على هذا الجهاز.","☁️ Resolve your cloud save before playing":"☁️ عالج مشكلة الحفظ السحابي قبل اللعب","☁️ Cloud save needs attention":"☁️ يحتاج الحفظ السحابي إلى انتباهك","Cloud feature unavailable":"ميزة الحفظ السحابي غير متاحة"},"es":{"💾 Device save · Sign in to enable cloud":"💾 Guardado local · Inicia sesión para activar la nube","☁️ Reading your cloud kingdom…":"☁️ Cargando tu reino en la nube…","☁️ Import this device’s kingdom to start cloud saves":"☁️ Importa el reino de este dispositivo para guardar en la nube","☁️ Cloud kingdom saved":"☁️ Reino guardado en la nube","☁️ Saving your kingdom…":"☁️ Guardando tu reino…","⚠️ Offline changes saved on this device — retry upload":"⚠️ Cambios guardados en este dispositivo sin conexión — reintenta la subida","⚠️ Cloud conflict — choose which save to keep":"⚠️ Conflicto de guardado en la nube — elige qué versión conservar","⚠️ Cloud unavailable — device progress remains available":"⚠️ Nube no disponible — tu progreso local sigue disponible","☁️ Cloud Kingdom":"☁️ Reino en la nube","Cloud request timed out. Verify the server before retrying.":"La solicitud a la nube agotó el tiempo. Comprueba el servidor antes de reintentar.","Another device has already changed this kingdom. Your unsynced progress is still kept on this device.":"Otro dispositivo ya cambió este reino. Tu progreso sin sincronizar sigue guardado en este dispositivo.","Creation acknowledgement uncertain. Reconnect to inspect the cloud before trying again.":"No se pudo confirmar la creación. Vuelve a conectarte y revisa la nube antes de reintentar.","Device storage is full or blocked; do not close this page before saving.":"El almacenamiento del dispositivo está lleno o bloqueado; no cierres esta página antes de guardar.","The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.":"La versión en la nube cambió en otro lugar. Tu copia local está a salvo; elige una opción de recuperación.","Could not contact Supabase":"No se pudo contactar con Supabase","No pending device save found":"No se encontró ningún guardado local pendiente","Could not verify cloud revision. Local changes are safe; retry when connected.":"No se pudo verificar la versión en la nube. Los cambios locales están a salvo; reintenta al conectarte.","Cloud read-back was invalid; nothing was uploaded.":"La comprobación de la nube fue inválida; no se subió nada.","Cloud is saved, but device cache could not be updated. Download a backup.":"El guardado en la nube está hecho, pero no se pudo actualizar la caché local. Descarga una copia de seguridad.","Cloud revision changed. Download the device backup before choosing which copy to keep.":"La versión en la nube cambió. Descarga la copia local antes de elegir qué versión conservar.","Game or Supabase client not available":"El juego o el cliente de Supabase no está disponible","Your game currently saves on this device. Sign in to enable account cloud saves.":"Tu partida se guarda actualmente en este dispositivo. Inicia sesión para activar el guardado en la nube de tu cuenta.","Checking your Supabase kingdom. Gameplay is briefly paused.":"Comprobando tu reino de Supabase. El juego se pausa brevemente.","No cloud kingdom exists for this account yet.":"Todavía no existe un reino en la nube para esta cuenta.","Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.":"Importa una vez el progreso de este dispositivo o elige expresamente empezar de cero. Los datos Alpha 0.9 del dispositivo seguirán respaldados.","☁️ Import this device’s progress":"☁️ Importar el progreso de este dispositivo","Start a fresh cloud kingdom":"Comenzar un reino nuevo en la nube","Your kingdom is saved to your account.":"Tu reino está guardado en tu cuenta.","Changes are uploading to Supabase.":"Se están subiendo los cambios a Supabase.","Last confirmed:":"Última confirmación:","⬇️ Download kingdom backup":"⬇️ Descargar copia de seguridad del reino","Not uploaded yet:":"Todavía no se ha subido:","Your unsynced changes are stored on this device.":"Tus cambios sin sincronizar están guardados en este dispositivo.","Retry upload":"Reintentar subida","Download device backup":"Descargar copia del dispositivo","Load cloud instead":"Cargar la versión en la nube","Cloud conflict:":"Conflicto en la nube:","We will NOT overwrite another device automatically.":"NO sobrescribiremos automáticamente el guardado de otro dispositivo.","Try safe upload":"Intentar subida segura","Use latest cloud version":"Usar la última versión en la nube","Cloud loading error:":"Error al cargar la nube:","Your original device save is not deleted.":"No se ha borrado tu guardado original del dispositivo.","Retry connection":"Reintentar conexión","Download local backup":"Descargar copia local","Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.":"Los guardados en la nube aún no se usan para el PvP competitivo ni las clasificaciones de poder. Eso requerirá progreso validado por servidor en una futura versión.","Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.":"¿Crear un reino NUEVO en la nube con los valores iniciales? Tu guardado original seguirá respaldado localmente.","IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.":"¿IMPORTAR el reino de este dispositivo a esta cuenta? Esto crea tu primer guardado en la nube. El guardado local original permanece intacto.","Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.":"¿Cargar la última versión del reino en la NUBE? Los cambios locales sin sincronizar no se fusionarán. Descarga primero una copia del dispositivo si quieres conservarlos.","Technical details (original):":"Detalles técnicos (texto original):","guest":"Invitado","loading":"Cargando","missing":"No existe","ready":"Guardado","syncing":"Sincronizando","offline":"Sin conexión","conflict":"Conflicto","error":"Error","Your latest kingdom changes are not yet uploaded. Sign out anyway? They will remain saved on this device.":"Tus últimos cambios del reino aún no se han subido. ¿Quieres cerrar sesión? Seguirán guardados en este dispositivo.","☁️ Resolve your cloud save before playing":"☁️ Resuelve el problema de guardado en la nube antes de jugar","☁️ Cloud save needs attention":"☁️ El guardado en la nube necesita atención","Cloud feature unavailable":"Función de nube no disponible"},"pt":{"💾 Device save · Sign in to enable cloud":"💾 Salvamento no dispositivo · Entre para ativar a nuvem","☁️ Reading your cloud kingdom…":"☁️ Lendo seu reino na nuvem…","☁️ Import this device’s kingdom to start cloud saves":"☁️ Importe o reino deste dispositivo para salvar na nuvem","☁️ Cloud kingdom saved":"☁️ Reino salvo na nuvem","☁️ Saving your kingdom…":"☁️ Salvando seu reino…","⚠️ Offline changes saved on this device — retry upload":"⚠️ Alterações salvas neste dispositivo sem conexão — tente enviar novamente","⚠️ Cloud conflict — choose which save to keep":"⚠️ Conflito de salvamento na nuvem — escolha qual versão manter","⚠️ Cloud unavailable — device progress remains available":"⚠️ Nuvem indisponível — seu progresso no dispositivo continua disponível","☁️ Cloud Kingdom":"☁️ Reino na nuvem","Cloud request timed out. Verify the server before retrying.":"A solicitação à nuvem expirou. Verifique o servidor antes de tentar novamente.","Another device has already changed this kingdom. Your unsynced progress is still kept on this device.":"Outro dispositivo já alterou este reino. Seu progresso não sincronizado continua salvo neste dispositivo.","Creation acknowledgement uncertain. Reconnect to inspect the cloud before trying again.":"A confirmação da criação é incerta. Reconecte-se e verifique a nuvem antes de tentar novamente.","Device storage is full or blocked; do not close this page before saving.":"O armazenamento do dispositivo está cheio ou bloqueado; não feche esta página antes de salvar.","The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.":"A versão na nuvem foi atualizada em outro lugar. Sua cópia local está protegida; escolha uma opção de recuperação.","Could not contact Supabase":"Não foi possível contatar o Supabase","No pending device save found":"Nenhum salvamento pendente no dispositivo foi encontrado","Could not verify cloud revision. Local changes are safe; retry when connected.":"Não foi possível verificar a revisão na nuvem. As alterações locais estão protegidas; tente novamente quando conectar.","Cloud read-back was invalid; nothing was uploaded.":"A leitura de verificação da nuvem foi inválida; nada foi enviado.","Cloud is saved, but device cache could not be updated. Download a backup.":"O salvamento na nuvem foi concluído, mas o cache local não pôde ser atualizado. Baixe um backup.","Cloud revision changed. Download the device backup before choosing which copy to keep.":"A revisão na nuvem mudou. Baixe o backup do dispositivo antes de escolher qual cópia manter.","Game or Supabase client not available":"O jogo ou cliente Supabase está indisponível","Your game currently saves on this device. Sign in to enable account cloud saves.":"Seu jogo está sendo salvo neste dispositivo. Entre para ativar o salvamento na nuvem da conta.","Checking your Supabase kingdom. Gameplay is briefly paused.":"Verificando seu reino no Supabase. O jogo fica pausado por alguns instantes.","No cloud kingdom exists for this account yet.":"Ainda não existe um reino na nuvem para esta conta.","Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.":"Importe o progresso deste dispositivo uma vez ou escolha expressamente começar do zero. Os dados Alpha 0.9 do dispositivo continuarão em backup.","☁️ Import this device’s progress":"☁️ Importar o progresso deste dispositivo","Start a fresh cloud kingdom":"Começar um novo reino na nuvem","Your kingdom is saved to your account.":"Seu reino está salvo na sua conta.","Changes are uploading to Supabase.":"Enviando as alterações para o Supabase.","Last confirmed:":"Última confirmação:","⬇️ Download kingdom backup":"⬇️ Baixar backup do reino","Not uploaded yet:":"Ainda não enviado:","Your unsynced changes are stored on this device.":"Suas alterações não sincronizadas estão salvas neste dispositivo.","Retry upload":"Tentar enviar novamente","Download device backup":"Baixar backup do dispositivo","Load cloud instead":"Carregar a versão da nuvem","Cloud conflict:":"Conflito na nuvem:","We will NOT overwrite another device automatically.":"NÃO sobrescreveremos automaticamente o salvamento de outro dispositivo.","Try safe upload":"Tentar envio seguro","Use latest cloud version":"Usar a versão mais recente da nuvem","Cloud loading error:":"Erro ao carregar a nuvem:","Your original device save is not deleted.":"Seu salvamento original do dispositivo não foi excluído.","Retry connection":"Tentar conexão novamente","Download local backup":"Baixar backup local","Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.":"Os salvamentos na nuvem ainda não são usados para PvP competitivo nem rankings de poder. Isso exigirá progressão validada pelo servidor em uma versão futura.","Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.":"Criar um NOVO reino na nuvem com os valores iniciais? Seu salvamento original permanecerá em backup no dispositivo.","IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.":"IMPORTAR o reino deste dispositivo para esta conta? Isso criará seu primeiro salvamento na nuvem. O salvamento local original permanecerá intacto.","Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.":"Carregar a versão mais recente do reino na NUVEM? As alterações locais não sincronizadas não serão mescladas. Baixe primeiro um backup do dispositivo se precisar delas.","Technical details (original):":"Detalhes técnicos (texto original):","guest":"Convidado","loading":"Carregando","missing":"Ausente","ready":"Salvo","syncing":"Sincronizando","offline":"Sem conexão","conflict":"Conflito","error":"Erro","Your latest kingdom changes are not yet uploaded. Sign out anyway? They will remain saved on this device.":"As últimas alterações do reino ainda não foram enviadas. Sair mesmo assim? Elas continuarão salvas neste dispositivo.","☁️ Resolve your cloud save before playing":"☁️ Resolva o problema do salvamento na nuvem antes de jogar","☁️ Cloud save needs attention":"☁️ O salvamento na nuvem precisa de atenção","Cloud feature unavailable":"Recurso de nuvem indisponível"}};
const cloudLang=()=>{try{const v=window.DDWorldwide?.getLanguage?.()||window.DDGameLocale?.summary?.().language||localStorage.getItem('dd59-language')||'en';return Object.prototype.hasOwnProperty.call(CLOUD_COPY,v)?v:'en'}catch(_){return 'en'}};
const cloudT=message=>{const l=cloudLang();return CLOUD_COPY[l]?.[message]||message};
const cloudErrorHTML=message=>{const value=String(message??'');const translated=cloudT(value);return translated!==value||cloudLang()==='en'?safe(translated):'<span>'+safe(cloudT('Technical details (original):'))+'</span> <bdi dir="ltr" data-dd-locale-ignore>'+safe(value)+'</bdi>'};

const CACHE='dino-v1-cloud-cache:';
let uid=null, mode='guest', revision=0, error='', updated='', inFlight=false, timer=null, queued=null, serial=0, serverSnapshot=null, lastSnapshot=null;
const localGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const localPut=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const snapshot=v=>JSON.parse(JSON.stringify(v));
// 6.17.2 — Safari may suspend promises while in the background. A deadline
// ends the UI wait WITHOUT aborting or replaying a potentially committed write.
// Cloud revision and the account-scoped dirty device cache remain authoritative.
const READ_DEADLINE_MS=12000,WRITE_DEADLINE_MS=16000;
function limited(promise,ms){
 let t;
 return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{
  t=setTimeout(()=>reject(Error('Cloud request timed out. Verify the server before retrying.')),ms);
 })]).finally(()=>clearTimeout(t));
}

const cacheKey=()=>CACHE+uid;
const isDirty=()=>uid&&!!localGet(cacheKey())?.dirty;
function refresh(){
 const statuses={guest:cloudT('💾 Device save · Sign in to enable cloud'),loading:cloudT('☁️ Reading your cloud kingdom…'),missing:cloudT('☁️ Import this device’s kingdom to start cloud saves'),ready:cloudT('☁️ Cloud kingdom saved'),syncing:cloudT('☁️ Saving your kingdom…'),offline:cloudT('⚠️ Offline changes saved on this device — retry upload'),conflict:cloudT('⚠️ Cloud conflict — choose which save to keep'),error:cloudT('⚠️ Cloud unavailable — device progress remains available')};
 const el=$('cloudStatus');if(el){el.textContent=statuses[mode]||cloudT('☁️ Cloud Kingdom');el.dataset.mode=mode}
 if(typeof window.DDOnlineRedraw==='function')window.DDOnlineRedraw();
}
function cached(){const x=localGet(cacheKey());return x&&typeof x==='object'?x:null}
function keep(state,dirty){if(!uid)return false;return localPut(cacheKey(),{revision,dirty,snapshot:snapshot(state),updated:Date.now()})}
// Compare JSON values, not object-key order: Postgres jsonb and browser JSON use different key order.
// This is strictly a save-recovery helper, never a merge of independent progress.
function sameState(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>sameState(x,b[i]));
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&sameState(a[k],b[k]));
}
function setGame(data){game.importState(data)}
function active(){return !!uid&&['ready','syncing','offline'].includes(mode)}
function locked(){return mode==='loading'||mode==='conflict'}
function pending(){return !!uid&&(!!queued||inFlight||!!isDirty())}
function stopTimer(){if(timer){clearTimeout(timer);timer=null}}
async function auth(nextUid){
 if(nextUid===uid&&mode!=='guest'&&mode!=='error')return;
 const token=++serial;stopTimer();queued=null;
 if(!nextUid){uid=null;mode='guest';revision=0;inFlight=false;serverSnapshot=null;error='';updated='';
   // The guest's original save is still on-device; do not leave signed-in progress visible.
   try{setGame(game.guestState())}catch(e){error=e.message}
   refresh();return;
 }
 uid=nextUid;revision=0;mode='loading';error='';updated='';inFlight=false;refresh();
 let data,fetchError;
 try{({data,error:fetchError}=await limited(client.from('dd_cloud_kingdoms')
   .select('state,revision,updated_at').eq('user_id',nextUid).maybeSingle(),READ_DEADLINE_MS));}
 catch(e){fetchError={message:String(e?.message||e)};}
 if(token!==serial||uid!==nextUid)return;
 if(fetchError){mode='error';error=fetchError.message;refresh();return}
 if(!data){mode='missing';refresh();return}
 revision=Number(data.revision);updated=data.updated_at||'';serverSnapshot=snapshot(data.state);
 const device=cached();
 if(device?.dirty&&device.snapshot){
   try{
     if(sameState(device.snapshot,data.state)){
       // A previous upload completed before the app was suspended, but its ack was lost.
       // Clear only the stale dirty flag; the authoritative cloud state is identical.
       setGame(data.state);keep(data.state,false);mode='ready';error='';
     }else if(Number(device.revision)===revision){
       // The server has NOT advanced. Safely resume with the normal atomic CAS RPC.
       // If another device races us, dd_cloud_update rejects stale revisions.
       setGame(device.snapshot);queued=snapshot(device.snapshot);mode='syncing';error='';
       timer=setTimeout(flush,250);
     }else{
       // Both copies changed: don't guess, merge, or overwrite. Require manual review.
       mode='conflict';error='Another device has already changed this kingdom. Your unsynced progress is still kept on this device.';
       setGame(device.snapshot);
     }
   }catch(e){mode='error';error=e.message}
 }else{
   try{setGame(data.state);keep(data.state,false);mode='ready';error=''}catch(e){mode='error';error=e.message}
 }
 refresh();
}
async function create(fresh){
 if(!uid||mode!=='missing')return;
 const content=fresh?game.freshState():game.guestState();
 const prompt=fresh?cloudT('Create a NEW cloud kingdom at starting values? Your original device save will stay backed up locally.'):cloudT('IMPORT your existing device kingdom to this account? This creates your first cloud save. Your original local save stays untouched.');
 if(!confirm(prompt))return;
 mode='loading';refresh();const target=uid;
 let data,saveError;
 try{({data,error:saveError}=await limited(client.rpc('dd_cloud_create',{p_state:content}),WRITE_DEADLINE_MS));}
 catch(e){
  // Creation might have reached Supabase before the connection timed out.
  // Never blindly repeat the CREATE. Reconnect to inspect the account first.
  if(target===uid){mode='error';error='Creation acknowledgement uncertain. Reconnect to inspect the cloud before trying again.';refresh()}
  return;
 }
 if(target!==uid)return;
 if(saveError){mode=saveError.message?.includes('already exists')?'error':'missing';error=saveError.message;refresh();throw saveError}
 revision=Number(data)||1;setGame(content);keep(content,false);serverSnapshot=snapshot(content);mode='ready';error='';refresh();
}
function onGameSave(data){
 if(!active())return;
 const latest=snapshot(data);lastSnapshot=latest;queued=latest;
 if(!keep(latest,true)){mode='offline';error='Device storage is full or blocked; do not close this page before saving.';refresh();return}
 if(mode==='offline'){refresh();return;}
 mode='syncing';refresh();stopTimer();timer=setTimeout(flush,650);
}
async function flush(){
 stopTimer();if(!uid||inFlight||!queued||!active())return;
 const whichUid=uid, token=serial;
 const sent=queued;queued=null;inFlight=true;mode='syncing';refresh();
 let data,writeError;
 try{({data,error:writeError}=await limited(client.rpc('dd_cloud_update',
   {p_state:sent,p_expected_revision:revision}),WRITE_DEADLINE_MS));}
 catch(e){writeError={message:String(e?.message||e)}}
 if(token!==serial||whichUid!==uid)return;
 inFlight=false;
 if(writeError){
   queued=queued||sent;
   if(/CLOUD_REVISION_CONFLICT/.test(writeError.message||'')){
     mode='conflict';error='The cloud version was updated elsewhere. Your device copy is safe; choose a recovery option.';
   }else{mode='offline';error=writeError.message||'Could not contact Supabase';}
   // IMPORTANT: the newest pending state already resides in account-scoped device cache.
   refresh();return;
 }
 revision=Number(data)||revision+1;updated=new Date().toISOString();serverSnapshot=snapshot(sent);
 if(queued){keep(queued,true);mode='syncing';refresh();timer=setTimeout(flush,200)}
 else{keep(sent,false);mode='ready';error='';refresh()}
}
async function retry(){
 if(!uid||!['offline','conflict'].includes(mode))return;
 const local=cached();if(!local?.dirty||!local.snapshot)throw Error('No pending device save found');
 // Always read back FIRST: a timed-out upload may already have committed.
 // Never resend blindly, even when the UI currently says OFFLINE.
 const target=uid,token=serial;
 let remote;
 try{
  const {data,error:e}=await limited(client.from('dd_cloud_kingdoms')
   .select('state,revision,updated_at').eq('user_id',target).single(),READ_DEADLINE_MS);
  if(e)throw e;remote=data;
 }catch(e){
  if(target===uid&&token===serial){mode='offline';error='Could not verify cloud revision. Local changes are safe; retry when connected.';refresh()}
  return;
 }
 if(target!==uid||token!==serial)return;
 if(!remote||!Number.isSafeInteger(Number(remote.revision))){
  mode='offline';error='Cloud read-back was invalid; nothing was uploaded.';refresh();return;
 }
 if(sameState(local.snapshot,remote.state)){
  // Previous request arrived but its acknowledgement was lost. Exactly this
  // account's cached data exists on the server: clear the stale dirty marker.
  revision=Number(remote.revision);updated=remote.updated_at||'';
  serverSnapshot=snapshot(remote.state);queued=null;inFlight=false;
  if(!keep(local.snapshot,false)){
   mode='offline';error='Cloud is saved, but device cache could not be updated. Download a backup.';
  }else{mode='ready';error=''}
  refresh();return;
 }
 if(Number(remote.revision)!==Number(local.revision)){
  mode='conflict';error='Cloud revision changed. Download the device backup before choosing which copy to keep.';
  refresh();return;
 }
 revision=Number(remote.revision);queued=snapshot(local.snapshot);
 mode='syncing';error='';refresh();await flush();
}
async function loadCloud(){
 if(!uid||!['conflict','offline','error'].includes(mode))return;
 if(!confirm(cloudT('Load the latest CLOUD kingdom? Your unsynced device changes will not be merged. Download a device backup first if you need them.')))return;
 const target=uid, token=serial;mode='loading';refresh();
 let data,e;
 try{({data,error:e}=await limited(client.from('dd_cloud_kingdoms')
   .select('state,revision,updated_at').eq('user_id',target).single(),READ_DEADLINE_MS));}
 catch(err){e={message:String(err?.message||err)}}
 if(target!==uid||token!==serial)return;
 if(e){mode='error';error=e.message;refresh();return}
 revision=Number(data.revision);updated=data.updated_at||'';serverSnapshot=snapshot(data.state);queued=null;
 setGame(data.state);keep(data.state,false);mode='ready';error='';refresh();
}
function download(which){
 const content=which==='device'?(cached()?.snapshot||game.exportState()):game.exportState();
 const blob=new Blob([JSON.stringify({game:'Dino Dominion',build:'v1-build1',scope:which,exported_at:new Date().toISOString(),state:content},null,2)],{type:'application/json'});
 const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='dino-dominion-'+which+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function panelHTML(){
 let detail='';
 if(mode==='guest')detail=`<p>${cloudT("Your game currently saves on this device. Sign in to enable account cloud saves.")}</p>`;
 if(mode==='loading')detail=`<p>${cloudT("Checking your Supabase kingdom. Gameplay is briefly paused.")}</p>`;
 if(mode==='missing')detail=`<p><b>${cloudT("No cloud kingdom exists for this account yet.")}</b> ${cloudT("Import your current device progress once, or explicitly start fresh. Existing Alpha 0.9 device data will remain backed up.")}</p><button data-do="cloudImport">${cloudT("☁️ Import this device’s progress")}</button><button class="secondary" data-do="cloudFresh">${cloudT("Start a fresh cloud kingdom")}</button>`;
 if(mode==='ready'||mode==='syncing')detail=`<p>${mode==='ready'?cloudT('Your kingdom is saved to your account.'):cloudT('Changes are uploading to Supabase.')}${updated?' ${cloudT("Last confirmed:")} '+safe(new Date(updated).toLocaleString(({en:'en-US',fr:'fr-CA',ar:'ar',es:'es-ES',pt:'pt-BR'})[cloudLang()]||'en-US')):''}</p><button class="secondary" data-do="cloudDownload">${cloudT("⬇️ Download kingdom backup")}</button>`;
 if(mode==='offline')detail=`<p><b>${cloudT("Not uploaded yet:")}</b> ${cloudErrorHTML(error)}. ${cloudT("Your unsynced changes are stored on this device.")}</p><button data-do="cloudRetry">${cloudT("Retry upload")}</button><button class="secondary" data-do="cloudDownloadDevice">${cloudT("Download device backup")}</button><button class="secondary" data-do="cloudLoad">${cloudT("Load cloud instead")}</button>`;
 if(mode==='conflict')detail=`<p><b>${cloudT("Cloud conflict:")}</b> ${cloudErrorHTML(error)}. ${cloudT("We will NOT overwrite another device automatically.")}</p><button data-do="cloudRetry">${cloudT("Try safe upload")}</button><button class="secondary" data-do="cloudDownloadDevice">${cloudT("Download device backup")}</button><button class="secondary" data-do="cloudLoad">${cloudT("Use latest cloud version")}</button>`;
 if(mode==='error')detail=`<p><b>${cloudT("Cloud loading error:")}</b> ${cloudErrorHTML(error)}. ${cloudT("Your original device save is not deleted.")}</p><button data-do="cloudReconnect">${cloudT("Retry connection")}</button><button class="secondary" data-do="cloudDownloadDevice">${cloudT("Download local backup")}</button>`;
 return `<div class="cloudPanel"><h3>${cloudT('☁️ Cloud Kingdom')} — ${safe(cloudLang()==='en'?mode.toUpperCase():cloudT(mode))}</h3>${detail}<p class="hint">${cloudT("Cloud saves aren't used for competitive PvP or power rankings yet. Those will require server-validated progression in a future build.")}</p></div>`;
}
async function action(name){
 if(name==='cloudImport')return create(false);
 if(name==='cloudFresh')return create(true);
 if(name==='cloudRetry')return retry();
 if(name==='cloudLoad')return loadCloud();
 if(name==='cloudReconnect'){const target=uid;uid=null;return auth(target)}
 if(name==='cloudDownload')return download('cloud');
 if(name==='cloudDownloadDevice')return download('device');
}
window.DDCloud={t:cloudT,isActive:active,isLocked:locked,hasPending:pending,onGameSave,panelHTML,action,getStatus:()=>({mode,revision,error,uid})};
refresh();
// One light attribute observer for the locale selector; never watches gameplay DOM.
const cloudLocaleObserver=new MutationObserver(records=>{
 if(records.some(r=>r.attributeName==='data-dd-game-locale'))refresh();
});
cloudLocaleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-dd-game-locale']});
if(client&&game){
  client.auth.onAuthStateChange((event,s)=>{setTimeout(()=>auth(s?.user?.id||null),0)});
  client.auth.getSession().then(({data})=>auth(data.session?.user?.id||null)).catch(e=>{mode='error';error=e.message;refresh()});
  window.addEventListener('online',()=>{if(mode==='offline'&&!inFlight)retry().catch(()=>{})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&queued)flush()});
}else{mode='error';error='Game or Supabase client not available';refresh()}
})();
