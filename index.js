const i18n = require('./i18n');
const https = require('https');
const { Plugin } = require('powercord/entities');
const { clipboard, nativeImage } = require('electron');
const { ContextMenu } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { getModule, i18n: { Messages } } = require('powercord/webpack');
const { getOwnerInstance, findInReactTree } = require('powercord/util');

const Settings = require('./components/Settings');

class ImageToClipboard extends Plugin {
    async startPlugin() {
        powercord.api.i18n.loadAllStrings(i18n);
        this.registerSettings();
        await this.injectContextMenu();
    }

    registerSettings() {
        powercord.api.settings.registerSettings(`itc-settings`, {
            category: this.entityID,
            label: Messages.IMAGE_TO_CLIPBOARD,
            render: Settings,
        });
    }

    async injectContextMenu() {
        const { imageWrapper } = await getModule(['imageWrapper']);
        const MessageContextMenu = await getModule(
            m => m.default && m.default.displayName === 'MessageContextMenu'
        );
        const Default = MessageContextMenu.default;

        inject('image-to-clipboard', MessageContextMenu, 'default', ([{ target }], res) => {

            if (
                target.tagName.toLowerCase() === 'img' &&
                target.parentElement.classList.contains(imageWrapper)
            ) {

                const nativeExists = findInReactTree(res.props.children, child =>
                    child?.props?.children && findInReactTree(child.props.children, c => c?.props?.id === 'copy-image')
                );
                if (nativeExists) return res;

                res.props.children.push(
                    ...ContextMenu.renderRawItems([
                        {
                            type: 'button',
                            name: Messages.COPY_TO_CLIPBOARD,
                            id: `image-to-clipboard`,
                            onClick: () => this.copyToClipboard(target)
                        }
                    ])
                );
            }

            return res;
        });

        Object.assign(MessageContextMenu.default, Default);
    }

    copyToClipboard(target) {
        const url = getOwnerInstance(target).props.href || target.src;

        try {
            https.get(url, res => {
                const data = [];

                res
                    .on('data', chunk => data.push(chunk))
                    .on('end', () => {
                        const buffer = Buffer.concat(data);

                        clipboard.write({ image: nativeImage.createFromBuffer(buffer) });
                    });
            });

            const toastOnSuccess = this.settings.get('toastOnSuccess', true);

            if (toastOnSuccess) {
                powercord.api.notices.sendToast('ITCSuccess', {
                    header: Messages.SUCCESS,
                    content: Messages.ITC_SUCCESS,
                    type: 'info',
                    timeout: 10e3,
                    buttons: [{
                        text: Messages.GOT_IT,
                        color: 'green',
                        size: 'medium',
                        look: 'outlined',
                    }],
                });
            }
        } catch (err) {
            return powercord.api.notices.sendToast('ITCError', {
                header: 'Error',
                content: `${Messages.ITC_ERROR} ${err.message}`,
                type: 'info',
                timeout: 10e3,
                buttons: [{
                    text: Messages.GOT_IT,
                    color: 'red',
                    size: 'medium',
                    look: 'outlined',
                }],
            });
        }
    }

    pluginWillUnload() {
        uninject('image-to-clipboard');
        powercord.api.settings.unregisterSettings('itc-settings');
    }
}

module.exports = ImageToClipboard;
