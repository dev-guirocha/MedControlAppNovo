require 'xcodeproj'

targets = []
targets << (defined?(Xcodeproj::Constants) ? Xcodeproj::Constants : nil)
targets << (defined?(Xcodeproj::Project) ? Xcodeproj::Project : nil)
targets.compact.each do |mod|
  if mod.const_defined?(:OBJECT_VERSION_TO_COMPATIBILITY_VERSION)
    map = mod.const_get(:OBJECT_VERSION_TO_COMPATIBILITY_VERSION)
    begin
      map[70] ||= 'Xcode 16.0'
      map[71] ||= 'Xcode 16.0'
    rescue => e
      warn "[xcodeproj_compat_patch] falha ao ajustar mapa: #{e}"
    end
  end
end
