import React, { useEffect, useState } from 'react';
import { inject, observer } from 'mobx-react';
import { f7 } from 'framework7-react';
import { useTranslation } from 'react-i18next';
import ToolbarView from "../view/Toolbar";

const ToolbarController = inject('storeAppOptions', 'users', 'storeFocusObjects', 'storeToolbarSettings', 'storePresentationInfo')(observer(props => {
    const {t} = useTranslation();
    const _t = t("Toolbar", { returnObjects: true });

    const appOptions = props.storeAppOptions;
    const isDisconnected = props.users.isDisconnected;
    const displayCollaboration = props.users.hasEditUsers || appOptions.canViewComments;

    const showEditDocument = !appOptions.isEdit && appOptions.canEdit && appOptions.canRequestEditRights;

    const isEditLocked = props.storeFocusObjects.isEditLocked;

    const storeToolbarSettings = props.storeToolbarSettings;
    const isCanUndo = storeToolbarSettings.isCanUndo;
    const isCanRedo = storeToolbarSettings.isCanRedo;
    const disabledPreview = storeToolbarSettings.countPages <= 0;

    const docInfo = props.storePresentationInfo;
    const docTitle = docInfo.dataDoc ? docInfo.dataDoc.title : '';

    useEffect(() => {
        Common.Gateway.on('init', loadConfig);
        Common.Notifications.on('toolbar:activatecontrols', activateControls);
        Common.Notifications.on('toolbar:deactivateeditcontrols', deactivateEditControls);
        Common.Notifications.on('goback', goBack);

        if (isDisconnected) {
            f7.popover.close();
            f7.sheet.close();
            f7.popup.close();
        }

        return () => {
            Common.Notifications.off('toolbar:activatecontrols', activateControls);
            Common.Notifications.off('toolbar:deactivateeditcontrols', deactivateEditControls);
            Common.Notifications.off('goback', goBack);
        }
    });

    // Back button
    const [isShowBack, setShowBack] = useState(appOptions.canBackToFolder);
    const loadConfig = (data) => {
        if (data && data.config && data.config.canBackToFolder !== false &&
            data.config.customization && data.config.customization.goback &&
            (data.config.customization.goback.url || data.config.customization.goback.requestClose && data.config.canRequestClose))
        {
            setShowBack(true);
        }
    };
    const onBack = () => {
        const api = Common.EditorApi.get();
        if (api.isDocumentModified()) {
            f7.dialog.create({
                title   : _t.dlgLeaveTitleText,
                text    : _t.dlgLeaveMsgText,
                verticalButtons: true,
                buttons : [
                    {
                        text: _t.leaveButtonText,
                        onClick: function() {
                            goBack(true);
                        }
                    },
                    {
                        text: _t.stayButtonText,
                        bold: true
                    }
                ]
            }).open();
        } else {
            goBack(true);
        }
    };
    const goBack = (current) => {
        //if ( !Common.Controllers.Desktop.process('goback') ) {
            if (appOptions.customization.goback.requestClose && appOptions.canRequestClose) {
                Common.Gateway.requestClose();
            } else {
                const href = appOptions.customization.goback.url;
                if (!current && appOptions.customization.goback.blank !== false) {
                    window.open(href, "_blank");
                } else {
                    parent.location.href = href;
                }
            }
        //}
    }

    const onUndo = () => {
        const api = Common.EditorApi.get();
        if (api) {
            api.Undo();
        }
    };
    const onRedo = () => {
        const api = Common.EditorApi.get();
        if (api) {
            api.Redo();
        }
    }

    const [disabledEditControls, setDisabledEditControls] = useState(false);
    const [disabledSettings, setDisabledSettings] = useState(false);
    const deactivateEditControls = (enableDownload) => {
        setDisabledEditControls(true);
        if (enableDownload) {
            //DE.getController('Settings').setMode({isDisconnected: true, enableDownload: enableDownload});
        } else {
            setDisabledSettings(true);
        }
    };


    const [disabledControls, setDisabledControls] = useState(/*true*/false);
    const activateControls = () => {
        setDisabledControls(false);
    };

    const onEditDocument = () => {
        Common.Gateway.requestEditRights();
    };

    return (
        <ToolbarView openOptions={props.openOptions}
                     isEdit={appOptions.isEdit}
                     docTitle={docTitle}
                     isShowBack={isShowBack}
                     onBack={onBack}
                     isCanUndo={isCanUndo}
                     isCanRedo={isCanRedo}
                     onUndo={onUndo}
                     onRedo={onRedo}
                     disabledEdit={isEditLocked}
                     disabledPreview={disabledPreview}
                     disabledControls={disabledControls}
                     disabledEditControls={disabledEditControls}
                     disabledSettings={disabledSettings}
                     displayCollaboration={displayCollaboration}
                     showEditDocument={showEditDocument}
                     onEditDocument={onEditDocument}
                     isDisconnected={isDisconnected}
        />
    )
}));

export {ToolbarController as Toolbar};