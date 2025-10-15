import { Gtk } from "ags/gtk4";
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time";

async function getWifiStrengthIcon(): Promise<string> {
  try {
    const strength = new Promise<String>((resolve) => {
      const strengthCmd = execAsync("sh -c 'nmcli -t -f signal device wifi list --rescan yes | head -n 1 | cut -d: -f8'");
      resolve(strengthCmd);
    });

    const percent = parseInt((await strength).split('\n')[0].trim());

    if (isNaN(percent) || percent < 1) return "network-wireless-symbolic";
    if (percent >= 90) return "network-wireless-signal-excellent-symbolic";
    if (percent >= 70) return "network-wireless-signal-good-symbolic";
    if (percent >= 50) return "network-wireless-signal-ok-symbolic";
    if (percent >= 30) return "network-wireless-signal-weak-symbolic";

    return "network-wireless-signal-none-symbolic";
  } catch (e) {
    console.error("Failed to get wifi strength: ", e);
    return "network-wireless-symbolic";
  }
}

async function getNetworkIcon(status: string) {
  if (status.includes("wifi      connected")) {
    return getWifiStrengthIcon();
  } else if (status.includes("ethernet  connected")) {
    return "network-wired-symbolic"
  }

  return "network-disconnect-symbolic"
}

function MenuButton() {
  const networkIcon = createPoll(
    "network-wireless-acquiring-symbolic",
    1000,
    () => {
      const status = exec("nmcli device status");;
      return getNetworkIcon(status);
    }
  );

  const bluetoothIcon = createPoll(
    "bluetooth-active-symbolic",
    3000,
    () => {
      const status = exec("bluetoothctl show");;
      return status.includes("Powered: yes") ? "bluetooth-active-symbolic" : "bluetooth-disabled-symbolic";
    }
  );

  return (
    <menubutton class="menu-button" $type="end" halign={Gtk.Align.CENTER}>
      <Gtk.Grid class="menu-button-grid" $type="end" halign={Gtk.Align.CENTER}>
        <Gtk.Image $type="end" iconName={bluetoothIcon} />
        <Gtk.Image $type="end" iconName={networkIcon} />
        <Gtk.Image $type="end" iconName="system-shutdown-symbolic" />
      </Gtk.Grid>
    </menubutton>
  );
}

export default MenuButton;