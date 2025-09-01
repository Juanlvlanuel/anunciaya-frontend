package online.anunciaya.app;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
      decor.setSystemUiVisibility(decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
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
      // Fuerza el mismo tamaño de texto que en navegador
      getBridge().getWebView().getSettings().setTextZoom(100);
    }
  }
}
