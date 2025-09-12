package online.anunciaya.app;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Quita rebote/overscroll global
    getWindow().getDecorView().setOverScrollMode(View.OVER_SCROLL_NEVER);

    // Fuerza iconos NEGROS en status bar
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      final WindowInsetsController c = getWindow().getInsetsController();
      if (c != null) {
        c.setSystemBarsAppearance(
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
        );
      }
    } else {
      final View decor = getWindow().getDecorView();
      decor.setSystemUiVisibility(
        decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
      );
    }

    // Aplica también al WebView de Capacitor
    WebView wv = getBridge() != null ? getBridge().getWebView() : null;
    if (wv != null) {
      wv.setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().getSettings().setTextZoom(100);
    }
  }

  // >>> Integración necesaria para @capgo/capacitor-social-login
  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
        requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {

      PluginHandle handle = getBridge().getPlugin("SocialLogin");
      if (handle == null) {
        Log.i("Google Activity Result", "SocialLogin handle is null");
        return;
      }
      Plugin plugin = handle.getInstance();
      if (!(plugin instanceof SocialLoginPlugin)) {
        Log.i("Google Activity Result", "Wrong plugin instance");
        return;
      }
      ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
    }
  }

  // Requerido por la interfaz del plugin
  @Override
  public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
