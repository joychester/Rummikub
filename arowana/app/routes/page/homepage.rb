module Arowana
    module Page
        
        class HomePage < BasePage
            
            get '/home' do
                # Pass session data to haml file by @param
                @login_name = session[:loginuser]
                haml :home
            end
            
        end
    end
end