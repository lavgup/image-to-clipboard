const { join } = require('path');
const request = require('request');
const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');
const { writeFileSync, unlinkSync } = require('fs');
const { clipboard, nativeImage } = require('electron');
const { getOwnerInstance } = require('powercord/util');
const { ContextMenu } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');

class ImageToClipboard extends Plugin {
    async startPlugin() {
        await this.injectContextMenu();
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
                res.props.children.push(
                    ...ContextMenu.renderRawItems([
                        {
                            type: 'button',
                            name: `Copy To Clipboard`,
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

        request({ url: url, encoding: null }, (error, response, buffer) => {
            if (error) {
                return powercord.api.notices.sendToast('ITCError', {
                    header: 'Error',
                    content: `Error occurred while copying image\n${error.message}`,
                    type: 'info',
                    timeout: 10e3,
                    buttons: [{
                        text: 'Got It',
                        color: 'red',
                        size: 'medium',
                        look: 'outlined',
                    }],
                });
            }

            if (process.platform === 'win32' || process.platform === 'darwin') {
                clipboard.write({ image: nativeImage.createFromBuffer(buffer) });
            } else {
                const file = join(process.env.HOME || process.env.USERPROFILE, 'img-to-clipboard (temp).png');
                writeFileSync(file, buffer, { encoding: null });
                clipboard.write({ image: file });
                unlinkSync(file);
            }
        });
    }

    pluginWillUnload() {
        uninject('image-to-clipboard');
    }
}

module.exports = ImageToClipboard;
