const { React } = require('powercord/webpack');
const { SwitchItem } = require('powercord/components/settings');

class Settings extends React.Component {
    render() {
        const { getSetting, toggleSetting } = this.props;

        return (
            <SwitchItem
                note="If a confirmation toast should be sent on success"
                value={getSetting("toastOnSuccess", true)}
                onChange={() => toggleSetting("toastOnSuccess")}
            >
                Send toast on success
            </SwitchItem>
        )
    }
}

module.exports = Settings;