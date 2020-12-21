const { SwitchItem } = require('powercord/components/settings');
const { React, i18n: { Messages } } = require('powercord/webpack');

class Settings extends React.Component {
    render() {
        const { getSetting, toggleSetting } = this.props;

        return (
            <SwitchItem
                note={Messages.ITC_TOAST_NOTE}
                value={getSetting("toastOnSuccess", true)}
                onChange={() => toggleSetting("toastOnSuccess")}
            >
                {Messages.SEND_TOAST}
            </SwitchItem>
        )
    }
}

module.exports = Settings;